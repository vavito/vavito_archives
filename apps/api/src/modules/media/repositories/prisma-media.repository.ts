import { Injectable } from '@nestjs/common';

import { PrismaService } from '@api/core/database/prisma.service';
import { MediaAssetStatus } from '@api/generated/prisma/client';
import type { MediaAsset } from '@api/modules/media/domain/entities/media-asset.entity';
import { MediaAssetMapper } from '@api/modules/media/mappers/media-asset.mapper';
import { MediaRepository } from '@api/modules/media/repositories/media.repository';

@Injectable()
export class PrismaMediaRepository implements MediaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(mediaAsset: MediaAsset): Promise<void> {
    await this.prisma.mediaAsset.create({ data: MediaAssetMapper.toPersistence(mediaAsset) });
  }

  async deleteIfOrphanedAndUnreferenced(id: string): Promise<boolean> {
    const result = await this.prisma.mediaAsset.deleteMany({
      where: {
        id,
        posts: { none: {} },
        status: MediaAssetStatus.ORPHANED,
      },
    });

    return result.count === 1;
  }

  async findById(id: string): Promise<MediaAsset | null> {
    const record = await this.prisma.mediaAsset.findUnique({ where: { id } });

    return record ? MediaAssetMapper.toDomain(record) : null;
  }

  async findByStoragePath(storagePath: string): Promise<MediaAsset | null> {
    const record = await this.prisma.mediaAsset.findUnique({ where: { storagePath } });

    return record ? MediaAssetMapper.toDomain(record) : null;
  }

  async findOrphanedBefore(cutoff: Date, limit: number): Promise<MediaAsset[]> {
    const records = await this.prisma.mediaAsset.findMany({
      orderBy: [{ orphanedAt: 'asc' }, { id: 'asc' }],
      take: limit,
      where: {
        orphanedAt: { lte: cutoff },
        status: MediaAssetStatus.ORPHANED,
      },
    });

    return records.map((record) => MediaAssetMapper.toDomain(record));
  }

  async findReadyWithoutPostReferencesBefore(cutoff: Date, limit: number): Promise<MediaAsset[]> {
    const records = await this.prisma.mediaAsset.findMany({
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: limit,
      where: {
        createdAt: { lte: cutoff },
        posts: { none: {} },
        status: MediaAssetStatus.READY,
      },
    });

    return records.map((record) => MediaAssetMapper.toDomain(record));
  }

  async hasPostReferences(id: string): Promise<boolean> {
    const count = await this.prisma.postMediaAsset.count({ where: { mediaAssetId: id } });

    return count > 0;
  }

  async save(mediaAsset: MediaAsset): Promise<void> {
    await this.prisma.mediaAsset.update({
      data: MediaAssetMapper.toUpdate(mediaAsset),
      where: { id: mediaAsset.id },
    });
  }
}
