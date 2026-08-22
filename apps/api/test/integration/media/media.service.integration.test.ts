import { randomUUID } from 'node:crypto';

import { Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';

import type { ApplicationConfig } from '@api/core/config/app.config';
import { PrismaService } from '@api/core/database/prisma.service';
import { StorageOperationError } from '@api/core/storage/errors/storage-operation.error';
import { MediaAssetStatus, MediaUsageType, UserRole } from '@api/generated/prisma/client';
import { PrismaMediaRepository } from '@api/modules/media/repositories/prisma-media.repository';
import { MediaCleanupService } from '@api/modules/media/services/media-cleanup.service';
import { MediaService } from '@api/modules/media/services/media.service';

import { FakeStorageService } from '../../fakes/media/fake-storage.service';
import { requireIntegrationDatabaseUrl } from '../../helpers/database-url';

const connectionString = requireIntegrationDatabaseUrl();
const MEDIA_BUCKET = 'media-integration';
const ONE_HOUR_IN_MILLISECONDS = 60 * 60 * 1000;

let cleanupService: MediaCleanupService;
let mediaService: MediaService;
let prisma: PrismaService;
let repository: PrismaMediaRepository;
let storage: FakeStorageService;
let profileIds: string[];
let loggerLog: jest.SpyInstance;

function databaseConfig(): ConfigService<ApplicationConfig, true> {
  return {
    get: jest.fn((path: string) => {
      if (path === 'database.connectOnStart') {
        return true;
      }
      if (path === 'database.url') {
        return connectionString;
      }

      throw new Error(`Configuração inesperada no teste: ${path}`);
    }),
  } as unknown as ConfigService<ApplicationConfig, true>;
}

function mediaConfig(): ConfigService<ApplicationConfig, true> {
  return {
    get: jest.fn((path: string) => {
      if (path === 'supabase.mediaBucket') {
        return MEDIA_BUCKET;
      }

      throw new Error(`Configuração inesperada no teste: ${path}`);
    }),
  } as unknown as ConfigService<ApplicationConfig, true>;
}

async function createAdmin(): Promise<string> {
  const id = randomUUID();

  await prisma.profile.create({
    data: { displayName: 'Admin da integração de mídia', id, role: UserRole.ADMIN },
  });
  profileIds.push(id);

  return id;
}

function uploadInput(createdById: string) {
  return {
    altText: 'Diagrama da integração de mídia',
    buffer: Buffer.from('controlled-media-content'),
    createdById,
    extension: 'webp',
    height: 630,
    mimeType: 'image/webp',
    width: 1200,
  };
}

describe('MediaService com PostgreSQL real e Storage controlado', () => {
  beforeAll(async () => {
    loggerLog = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    prisma = new PrismaService(databaseConfig());
    repository = new PrismaMediaRepository(prisma);
    storage = new FakeStorageService();
    mediaService = new MediaService(repository, storage, mediaConfig());
    cleanupService = new MediaCleanupService(repository, storage, mediaConfig());
    await prisma.onModuleInit();
  });

  beforeEach(() => {
    profileIds = [];
    storage.reset();
  });

  afterEach(async () => {
    await prisma.post.deleteMany({ where: { authorId: { in: profileIds } } });
    await prisma.mediaAsset.deleteMany({ where: { createdById: { in: profileIds } } });
    await prisma.profile.deleteMany({ where: { id: { in: profileIds } } });
  });

  afterAll(async () => {
    await prisma.onModuleDestroy();
    loggerLog.mockRestore();
  });

  it('persiste READY somente depois de armazenar o objeto', async () => {
    const adminId = await createAdmin();

    const result = await mediaService.upload(uploadInput(adminId));
    const persisted = await prisma.mediaAsset.findUniqueOrThrow({
      where: { id: result.mediaAsset.id },
    });

    expect(persisted).toMatchObject({
      altText: 'Diagrama da integração de mídia',
      createdById: adminId,
      height: 630,
      mimeType: 'image/webp',
      sizeBytes: BigInt('controlled-media-content'.length),
      status: MediaAssetStatus.READY,
      width: 1200,
    });
    expect(storage.hasObject(MEDIA_BUCKET, persisted.storagePath)).toBe(true);
    expect(result.publicUrl).toBe(`https://storage.test/${MEDIA_BUCKET}/${persisted.storagePath}`);
  });

  it('persiste FAILED quando o Storage rejeita o upload', async () => {
    const adminId = await createAdmin();
    storage.failNextUpload();

    await expect(mediaService.upload(uploadInput(adminId))).rejects.toBeInstanceOf(
      StorageOperationError,
    );

    const persisted = await prisma.mediaAsset.findFirstOrThrow({
      where: { createdById: adminId },
    });
    expect(persisted).toMatchObject({
      failureReason: 'Storage upload failed.',
      status: MediaAssetStatus.FAILED,
    });
    expect(storage.hasObject(MEDIA_BUCKET, persisted.storagePath)).toBe(false);
  });

  it('percorre READY, ORPHANED e purge respeitando as duas janelas', async () => {
    const adminId = await createAdmin();
    const uploaded = await mediaService.upload(uploadInput(adminId));
    const firstCleanupAt = new Date(Date.now() + 48 * ONE_HOUR_IN_MILLISECONDS);

    const firstSummary = await cleanupService.cleanup(
      { dryRun: false, limit: 100, olderThanHours: 24 },
      firstCleanupAt,
    );
    const orphaned = await prisma.mediaAsset.findUniqueOrThrow({
      where: { id: uploaded.mediaAsset.id },
    });

    expect(firstSummary.markedOrphanedIds).toEqual([uploaded.mediaAsset.id]);
    expect(firstSummary.purgedIds).toEqual([]);
    expect(orphaned).toMatchObject({
      orphanedAt: firstCleanupAt,
      status: MediaAssetStatus.ORPHANED,
    });
    expect(storage.hasObject(MEDIA_BUCKET, orphaned.storagePath)).toBe(true);

    const secondSummary = await cleanupService.cleanup(
      { dryRun: false, limit: 100, olderThanHours: 24 },
      new Date(firstCleanupAt.getTime() + 25 * ONE_HOUR_IN_MILLISECONDS),
    );

    expect(secondSummary.purgedIds).toEqual([uploaded.mediaAsset.id]);
    await expect(
      prisma.mediaAsset.findUnique({ where: { id: uploaded.mediaAsset.id } }),
    ).resolves.toBeNull();
    expect(storage.hasObject(MEDIA_BUCKET, orphaned.storagePath)).toBe(false);
  });

  it('restaura mídia referenciada e não remove seu objeto', async () => {
    const adminId = await createAdmin();
    const uploaded = await mediaService.upload(uploadInput(adminId));
    const orphanedAt = new Date(
      uploaded.mediaAsset.createdAt.getTime() + 48 * ONE_HOUR_IN_MILLISECONDS,
    );
    const postId = randomUUID();

    const orphanSummary = await cleanupService.cleanup(
      { dryRun: false, limit: 100, olderThanHours: 24 },
      orphanedAt,
    );
    expect(orphanSummary.markedOrphanedIds).toEqual([uploaded.mediaAsset.id]);

    await prisma.post.create({
      data: {
        authorId: adminId,
        content: { content: [], type: 'doc' },
        id: postId,
        title: 'Post que recupera a mídia',
      },
    });
    await prisma.postMediaAsset.create({
      data: {
        mediaAssetId: uploaded.mediaAsset.id,
        postId,
        usage: MediaUsageType.CONTENT,
      },
    });

    const summary = await cleanupService.cleanup(
      { dryRun: false, limit: 100, olderThanHours: 24 },
      new Date(orphanedAt.getTime() + 25 * ONE_HOUR_IN_MILLISECONDS),
    );
    const restored = await prisma.mediaAsset.findUniqueOrThrow({
      where: { id: uploaded.mediaAsset.id },
    });

    expect(summary.restoredReferencedIds).toEqual([uploaded.mediaAsset.id]);
    expect(restored).toMatchObject({ orphanedAt: null, status: MediaAssetStatus.READY });
    expect(storage.removeAttempts).toEqual([]);
    expect(storage.hasObject(MEDIA_BUCKET, restored.storagePath)).toBe(true);
  });
});
