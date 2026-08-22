import { MediaAssetStatus as PrismaMediaAssetStatus } from '@api/generated/prisma/client';
import { MediaAsset } from '@api/modules/media/domain/entities/media-asset.entity';
import { MediaAssetStatus } from '@api/modules/media/domain/enums/media-asset-status.enum';
import { MediaMetadata } from '@api/modules/media/domain/value-objects/media-metadata.value-object';
import { MediaAssetMapper } from '@api/modules/media/mappers/media-asset.mapper';

const ASSET_ID = '29e47526-8ff8-4505-b478-148621e5acb4';
const PROFILE_ID = '2cc721a8-2db5-4e7f-b68a-d807546b5206';
const PATH = '2026/08/17ddc84d-cfc9-48c2-b4c1-fd4d2f60a8f6.webp';
const CREATED_AT = new Date('2026-08-22T10:00:00.000Z');

describe('MediaAssetMapper', () => {
  it('converte o agregado READY para persistência Prisma', () => {
    const mediaAsset = MediaAsset.restore({
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

    expect(MediaAssetMapper.toPersistence(mediaAsset)).toEqual({
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
  });

  it('restaura um registro FAILED sem perder o motivo da falha', () => {
    const mediaAsset = MediaAssetMapper.toDomain({
      altText: 'Imagem editorial',
      createdAt: CREATED_AT,
      createdById: PROFILE_ID,
      failureReason: 'Storage upload failed.',
      height: null,
      id: ASSET_ID,
      mimeType: 'image/webp',
      orphanedAt: null,
      sizeBytes: 2048n,
      status: PrismaMediaAssetStatus.FAILED,
      storagePath: PATH,
      updatedAt: CREATED_AT,
      width: null,
    });

    expect(mediaAsset.status).toBe(MediaAssetStatus.FAILED);
    expect(mediaAsset.failureReason).toBe('Storage upload failed.');
    expect(mediaAsset.storagePath).toBe(PATH);
  });
});
