import { Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';

import type { ApplicationConfig } from '@api/core/config/app.config';
import type { StorageService } from '@api/core/storage/services/storage.service';
import { MediaAsset } from '@api/modules/media/domain/entities/media-asset.entity';
import { MediaAssetStatus } from '@api/modules/media/domain/enums/media-asset-status.enum';
import { MediaMetadata } from '@api/modules/media/domain/value-objects/media-metadata.value-object';
import type { MediaRepository } from '@api/modules/media/repositories/media.repository';
import { MediaCleanupService } from '@api/modules/media/services/media-cleanup.service';

const NOW = new Date('2026-08-22T12:00:00.000Z');
const CREATED_AT = new Date('2026-08-20T12:00:00.000Z');
const PROFILE_ID = '2cc721a8-2db5-4e7f-b68a-d807546b5206';
const READY_ID = '29e47526-8ff8-4505-b478-148621e5acb4';
const ORPHANED_ID = 'a7b3f11d-8ba6-4a2b-a0e8-d7ea45c023c2';

function mediaAsset(id: string, status: MediaAssetStatus): MediaAsset {
  return MediaAsset.restore({
    createdAt: CREATED_AT,
    createdById: PROFILE_ID,
    failureReason: null,
    id,
    metadata: MediaMetadata.create({
      altText: 'Imagem editorial',
      height: 720,
      mimeType: 'image/webp',
      sizeBytes: 2048,
      storagePath: `2026/08/${id}.webp`,
      width: 1280,
    }),
    orphanedAt: status === MediaAssetStatus.ORPHANED ? CREATED_AT : null,
    status,
    updatedAt: CREATED_AT,
  });
}

describe('MediaCleanupService', () => {
  const deleteIfOrphanedAndUnreferenced = jest.fn<Promise<boolean>, [string]>();
  const findOrphanedBefore = jest.fn<Promise<MediaAsset[]>, [Date, number]>();
  const findReadyWithoutPostReferencesBefore = jest.fn<Promise<MediaAsset[]>, [Date, number]>();
  const hasPostReferences = jest.fn<Promise<boolean>, [string]>();
  const save = jest.fn<Promise<void>, [MediaAsset]>();
  const remove = jest.fn<
    ReturnType<StorageService['remove']>,
    Parameters<StorageService['remove']>
  >();
  const repository = {
    deleteIfOrphanedAndUnreferenced,
    findOrphanedBefore,
    findReadyWithoutPostReferencesBefore,
    hasPostReferences,
    save,
  } as unknown as MediaRepository;
  const storage = { remove } as unknown as StorageService;
  const config = { get: jest.fn().mockReturnValue('media') } as unknown as ConfigService<
    ApplicationConfig,
    true
  >;
  const service = new MediaCleanupService(repository, storage, config);
  let loggerError: jest.SpyInstance;
  let loggerLog: jest.SpyInstance;

  beforeAll(() => {
    loggerError = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    loggerLog = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    findReadyWithoutPostReferencesBefore.mockResolvedValue([]);
    findOrphanedBefore.mockResolvedValue([]);
  });

  afterAll(() => {
    loggerError.mockRestore();
    loggerLog.mockRestore();
  });

  it('faz dry run sem alterar banco ou Storage', async () => {
    findReadyWithoutPostReferencesBefore.mockResolvedValueOnce([
      mediaAsset(READY_ID, MediaAssetStatus.READY),
    ]);
    findOrphanedBefore.mockResolvedValueOnce([mediaAsset(ORPHANED_ID, MediaAssetStatus.ORPHANED)]);
    hasPostReferences.mockResolvedValue(false);

    const result = await service.cleanup({ dryRun: true, limit: 100, olderThanHours: 24 }, NOW);

    expect(result.cutoff).toBe('2026-08-21T12:00:00.000Z');
    expect(result.wouldMarkOrphanedIds).toEqual([READY_ID]);
    expect(result.wouldPurgeIds).toEqual([ORPHANED_ID]);
    expect(save).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
    expect(deleteIfOrphanedAndUnreferenced).not.toHaveBeenCalled();
    expect(loggerLog).toHaveBeenCalledWith(expect.stringContaining('media_orphan_cleanup'));
  });

  it('marca READY sem referência e remove ORPHANED após nova validação', async () => {
    const ready = mediaAsset(READY_ID, MediaAssetStatus.READY);
    const orphaned = mediaAsset(ORPHANED_ID, MediaAssetStatus.ORPHANED);
    findReadyWithoutPostReferencesBefore.mockResolvedValueOnce([ready]);
    findOrphanedBefore.mockResolvedValueOnce([orphaned]);
    hasPostReferences.mockResolvedValue(false);
    deleteIfOrphanedAndUnreferenced.mockResolvedValueOnce(true);

    const result = await service.cleanup({ dryRun: false, limit: 100, olderThanHours: 24 }, NOW);

    expect(ready.status).toBe(MediaAssetStatus.ORPHANED);
    expect(ready.orphanedAt).toEqual(NOW);
    expect(save).toHaveBeenCalledWith(ready);
    expect(remove).toHaveBeenCalledWith('media', orphaned.storagePath);
    expect(deleteIfOrphanedAndUnreferenced).toHaveBeenCalledWith(ORPHANED_ID);
    expect(result.markedOrphanedIds).toEqual([READY_ID]);
    expect(result.purgedIds).toEqual([ORPHANED_ID]);
  });

  it('não remove referenciados e restaura ORPHANED para READY', async () => {
    const ready = mediaAsset(READY_ID, MediaAssetStatus.READY);
    const orphaned = mediaAsset(ORPHANED_ID, MediaAssetStatus.ORPHANED);
    findReadyWithoutPostReferencesBefore.mockResolvedValueOnce([ready]);
    findOrphanedBefore.mockResolvedValueOnce([orphaned]);
    hasPostReferences.mockResolvedValue(true);

    const result = await service.cleanup({ dryRun: false, limit: 100, olderThanHours: 24 }, NOW);

    expect(result.skippedReferencedIds).toEqual([READY_ID]);
    expect(result.restoredReferencedIds).toEqual([ORPHANED_ID]);
    expect(orphaned.status).toBe(MediaAssetStatus.READY);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith(orphaned);
    expect(remove).not.toHaveBeenCalled();
  });

  it('mantém o registro e reporta falha quando o Storage não remove o objeto', async () => {
    findOrphanedBefore.mockResolvedValueOnce([mediaAsset(ORPHANED_ID, MediaAssetStatus.ORPHANED)]);
    hasPostReferences.mockResolvedValueOnce(false);
    remove.mockRejectedValueOnce(new Error('storage unavailable'));

    const result = await service.cleanup({ dryRun: false, limit: 100, olderThanHours: 24 }, NOW);

    expect(result.failedIds).toEqual([ORPHANED_ID]);
    expect(deleteIfOrphanedAndUnreferenced).not.toHaveBeenCalled();
    expect(loggerError).toHaveBeenCalledWith(expect.stringContaining(ORPHANED_ID));
  });

  it('rejeita opções que não representam uma janela e lote positivos', async () => {
    await expect(
      service.cleanup({ dryRun: true, limit: 0, olderThanHours: 24 }, NOW),
    ).rejects.toThrow('positive safe integers');
  });
});
