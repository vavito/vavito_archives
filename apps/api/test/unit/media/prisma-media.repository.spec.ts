import type { PrismaService } from '@api/core/database/prisma.service';
import type { MediaAsset as PrismaMediaAsset, Prisma } from '@api/generated/prisma/client';
import { MediaAssetStatus as PrismaMediaAssetStatus } from '@api/generated/prisma/client';
import { MediaAsset } from '@api/modules/media/domain/entities/media-asset.entity';
import { MediaAssetStatus } from '@api/modules/media/domain/enums/media-asset-status.enum';
import { MediaMetadata } from '@api/modules/media/domain/value-objects/media-metadata.value-object';
import { PrismaMediaRepository } from '@api/modules/media/repositories/prisma-media.repository';

const ASSET_ID = '29e47526-8ff8-4505-b478-148621e5acb4';
const PROFILE_ID = '2cc721a8-2db5-4e7f-b68a-d807546b5206';
const PATH = '2026/08/17ddc84d-cfc9-48c2-b4c1-fd4d2f60a8f6.webp';
const CREATED_AT = new Date('2026-08-22T10:00:00.000Z');

function readyAsset(): MediaAsset {
  return MediaAsset.restore({
    createdAt: CREATED_AT,
    createdById: PROFILE_ID,
    failureReason: null,
    id: ASSET_ID,
    metadata: MediaMetadata.create({
      altText: 'Imagem editorial',
      height: 720,
      mimeType: 'image/webp',
      sizeBytes: 2048,
      storagePath: PATH,
      width: 1280,
    }),
    orphanedAt: null,
    status: MediaAssetStatus.READY,
    updatedAt: CREATED_AT,
  });
}

describe('PrismaMediaRepository', () => {
  const create = jest.fn<Promise<PrismaMediaAsset>, [Prisma.MediaAssetCreateArgs]>();
  const deleteMany = jest.fn<Promise<{ count: number }>, [Prisma.MediaAssetDeleteManyArgs]>();
  const findMany = jest.fn<Promise<PrismaMediaAsset[]>, [Prisma.MediaAssetFindManyArgs]>();
  const findUnique = jest.fn<Promise<PrismaMediaAsset | null>, [Prisma.MediaAssetFindUniqueArgs]>();
  const update = jest.fn<Promise<PrismaMediaAsset>, [Prisma.MediaAssetUpdateArgs]>();
  const count = jest.fn<Promise<number>, [Prisma.PostMediaAssetCountArgs]>();
  const prisma = {
    mediaAsset: { create, deleteMany, findMany, findUnique, update },
    postMediaAsset: { count },
  } as unknown as PrismaService;
  const repository = new PrismaMediaRepository(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('persiste os metadados do agregado', async () => {
    const mediaAsset = readyAsset();

    await repository.create(mediaAsset);

    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0]?.[0].data).toMatchObject({
      id: ASSET_ID,
      sizeBytes: 2048n,
      status: PrismaMediaAssetStatus.READY,
      storagePath: PATH,
    });
  });

  it('consulta um ativo pelo path único', async () => {
    findUnique.mockResolvedValueOnce({
      altText: 'Imagem editorial',
      createdAt: CREATED_AT,
      createdById: PROFILE_ID,
      failureReason: null,
      height: 720,
      id: ASSET_ID,
      mimeType: 'image/webp',
      orphanedAt: null,
      sizeBytes: 2048n,
      status: PrismaMediaAssetStatus.READY,
      storagePath: PATH,
      updatedAt: CREATED_AT,
      width: 1280,
    });

    await expect(repository.findByStoragePath(PATH)).resolves.toMatchObject({ id: ASSET_ID });
    expect(findUnique).toHaveBeenCalledWith({ where: { storagePath: PATH } });
  });

  it('lista READY antigos sem referências usando ordem estável', async () => {
    const cutoff = new Date('2026-08-21T10:00:00.000Z');
    findMany.mockResolvedValueOnce([]);

    await expect(repository.findReadyWithoutPostReferencesBefore(cutoff, 100)).resolves.toEqual([]);
    expect(findMany).toHaveBeenCalledWith({
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: 100,
      where: {
        createdAt: { lte: cutoff },
        posts: { none: {} },
        status: PrismaMediaAssetStatus.READY,
      },
    });
  });

  it('lista ORPHANED que já cumpriram a segunda janela de segurança', async () => {
    const cutoff = new Date('2026-08-21T10:00:00.000Z');
    findMany.mockResolvedValueOnce([]);

    await expect(repository.findOrphanedBefore(cutoff, 50)).resolves.toEqual([]);
    expect(findMany).toHaveBeenCalledWith({
      orderBy: [{ orphanedAt: 'asc' }, { id: 'asc' }],
      take: 50,
      where: {
        orphanedAt: { lte: cutoff },
        status: PrismaMediaAssetStatus.ORPHANED,
      },
    });
  });

  it('detecta referências existentes em posts', async () => {
    count.mockResolvedValueOnce(1);

    await expect(repository.hasPostReferences(ASSET_ID)).resolves.toBe(true);
    expect(count).toHaveBeenCalledWith({ where: { mediaAssetId: ASSET_ID } });
  });

  it('atualiza somente o registro do agregado informado', async () => {
    const mediaAsset = readyAsset();

    await repository.save(mediaAsset);

    expect(update).toHaveBeenCalledTimes(1);
    expect(update.mock.calls[0]?.[0].data).toMatchObject({
      status: PrismaMediaAssetStatus.READY,
    });
    expect(update.mock.calls[0]?.[0].where).toEqual({ id: ASSET_ID });
  });

  it('remove somente ORPHANED ainda sem referências', async () => {
    deleteMany.mockResolvedValueOnce({ count: 1 });

    await expect(repository.deleteIfOrphanedAndUnreferenced(ASSET_ID)).resolves.toBe(true);
    expect(deleteMany).toHaveBeenCalledWith({
      where: {
        id: ASSET_ID,
        posts: { none: {} },
        status: PrismaMediaAssetStatus.ORPHANED,
      },
    });
  });
});
