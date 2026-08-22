import { Injectable } from '@nestjs/common';

import { PrismaService } from '@api/core/database/prisma.service';
import type { MediaAsset } from '@api/modules/media/domain/entities/media-asset.entity';
import { MediaAssetMapper } from '@api/modules/media/mappers/media-asset.mapper';
import { MediaRepository } from '@api/modules/media/repositories/media.repository';

@Injectable()
export class PrismaMediaRepository implements MediaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(mediaAsset: MediaAsset): Promise<void> {
    await this.prisma.mediaAsset.create({ data: MediaAssetMapper.toPersistence(mediaAsset) });
  }

  async findById(id: string): Promise<MediaAsset | null> {
    const record = await this.prisma.mediaAsset.findUnique({ where: { id } });

    return record ? MediaAssetMapper.toDomain(record) : null;
  }

  async findByStoragePath(storagePath: string): Promise<MediaAsset | null> {
    const record = await this.prisma.mediaAsset.findUnique({ where: { storagePath } });

    return record ? MediaAssetMapper.toDomain(record) : null;
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
