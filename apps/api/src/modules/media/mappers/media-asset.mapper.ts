import type { MediaAsset as PrismaMediaAsset, Prisma } from '@api/generated/prisma/client';
import { MediaAssetStatus as PrismaMediaAssetStatus } from '@api/generated/prisma/client';
import { MediaAsset } from '@api/modules/media/domain/entities/media-asset.entity';
import { MediaAssetStatus } from '@api/modules/media/domain/enums/media-asset-status.enum';
import { MediaMetadata } from '@api/modules/media/domain/value-objects/media-metadata.value-object';

const domainStatusByPrisma: Readonly<Record<PrismaMediaAssetStatus, MediaAssetStatus>> = {
  [PrismaMediaAssetStatus.FAILED]: MediaAssetStatus.FAILED,
  [PrismaMediaAssetStatus.ORPHANED]: MediaAssetStatus.ORPHANED,
  [PrismaMediaAssetStatus.READY]: MediaAssetStatus.READY,
  [PrismaMediaAssetStatus.UPLOADING]: MediaAssetStatus.UPLOADING,
};

const prismaStatusByDomain: Readonly<Record<MediaAssetStatus, PrismaMediaAssetStatus>> = {
  [MediaAssetStatus.FAILED]: PrismaMediaAssetStatus.FAILED,
  [MediaAssetStatus.ORPHANED]: PrismaMediaAssetStatus.ORPHANED,
  [MediaAssetStatus.READY]: PrismaMediaAssetStatus.READY,
  [MediaAssetStatus.UPLOADING]: PrismaMediaAssetStatus.UPLOADING,
};

function persistenceFields(mediaAsset: MediaAsset) {
  return {
    altText: mediaAsset.altText,
    failureReason: mediaAsset.failureReason,
    height: mediaAsset.height,
    mimeType: mediaAsset.mimeType,
    orphanedAt: mediaAsset.orphanedAt,
    sizeBytes: BigInt(mediaAsset.sizeBytes),
    status: prismaStatusByDomain[mediaAsset.status],
    storagePath: mediaAsset.storagePath,
    updatedAt: mediaAsset.updatedAt,
    width: mediaAsset.width,
  };
}

export class MediaAssetMapper {
  static toDomain(record: PrismaMediaAsset): MediaAsset {
    return MediaAsset.restore({
      createdAt: record.createdAt,
      createdById: record.createdById,
      failureReason: record.failureReason,
      id: record.id,
      metadata: MediaMetadata.create({
        altText: record.altText,
        height: record.height,
        mimeType: record.mimeType,
        sizeBytes: Number(record.sizeBytes),
        storagePath: record.storagePath,
        width: record.width,
      }),
      orphanedAt: record.orphanedAt,
      status: domainStatusByPrisma[record.status],
      updatedAt: record.updatedAt,
    });
  }

  static toPersistence(mediaAsset: MediaAsset): Prisma.MediaAssetUncheckedCreateInput {
    return {
      ...persistenceFields(mediaAsset),
      createdAt: mediaAsset.createdAt,
      createdById: mediaAsset.createdById,
      id: mediaAsset.id,
    };
  }

  static toUpdate(mediaAsset: MediaAsset): Prisma.MediaAssetUncheckedUpdateInput {
    return persistenceFields(mediaAsset);
  }
}
