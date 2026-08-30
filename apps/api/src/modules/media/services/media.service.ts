import { randomUUID } from 'node:crypto';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { ApplicationConfig } from '@api/core/config/app.config';
import { StorageService } from '@api/core/storage/services/storage.service';
import { MediaAsset } from '@api/modules/media/domain/entities/media-asset.entity';
import { MediaStorageInconsistentError } from '@api/modules/media/domain/errors/media-storage-inconsistent.error';
import { MediaMetadata } from '@api/modules/media/domain/value-objects/media-metadata.value-object';
import { MediaRepository } from '@api/modules/media/repositories/media.repository';

const STORAGE_UPLOAD_FAILED = 'Storage upload failed.';
const METADATA_PERSISTENCE_FAILED = 'Metadata persistence failed.';

export interface UploadMediaInput {
  altText: string;
  buffer: Buffer;
  createdById: string;
  extension: string;
  height: number;
  mimeType: string;
  width: number;
}

export interface UploadMediaResult {
  mediaAsset: MediaAsset;
  publicUrl: string;
}

function storagePath(now: Date, extension: string): string {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');

  return `${year}/${month}/${randomUUID()}.${extension.trim().toLowerCase()}`;
}

function restoreUploading(mediaAsset: MediaAsset): MediaAsset {
  return MediaAsset.restore({
    createdAt: mediaAsset.createdAt,
    createdById: mediaAsset.createdById,
    failureReason: mediaAsset.failureReason,
    id: mediaAsset.id,
    metadata: mediaAsset.metadata,
    orphanedAt: mediaAsset.orphanedAt,
    status: mediaAsset.status,
    updatedAt: mediaAsset.updatedAt,
  });
}

@Injectable()
export class MediaService {
  private readonly bucket: string;
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private readonly mediaRepository: MediaRepository,
    private readonly storage: StorageService,
    configService: ConfigService<ApplicationConfig, true>,
  ) {
    this.bucket = configService.get('supabase.mediaBucket', { infer: true });
  }

  publicUrl(storagePath: string): string {
    return this.storage.publicUrl(this.bucket, storagePath);
  }

  async upload(input: UploadMediaInput): Promise<UploadMediaResult> {
    const createdAt = new Date();
    const path = storagePath(createdAt, input.extension);
    const preliminaryMetadata = MediaMetadata.create({
      altText: input.altText,
      height: null,
      mimeType: input.mimeType,
      sizeBytes: input.buffer.byteLength,
      storagePath: path,
      width: null,
    });
    const completeMetadata = MediaMetadata.create({
      altText: input.altText,
      height: input.height,
      mimeType: input.mimeType,
      sizeBytes: input.buffer.byteLength,
      storagePath: path,
      width: input.width,
    });
    const uploadingAsset = MediaAsset.create({
      createdById: input.createdById,
      id: randomUUID(),
      metadata: preliminaryMetadata,
      now: createdAt,
    });

    await this.mediaRepository.create(uploadingAsset);

    try {
      await this.storage.upload({
        bucket: this.bucket,
        buffer: input.buffer,
        contentType: completeMetadata.mimeType,
        path,
      });
    } catch (error) {
      await this.persistUploadFailure(uploadingAsset, STORAGE_UPLOAD_FAILED);
      throw error;
    }

    const readyAsset = restoreUploading(uploadingAsset);
    readyAsset.markReady(completeMetadata, new Date());

    try {
      await this.mediaRepository.save(readyAsset);
    } catch (error) {
      await this.rollbackUploadedObject(uploadingAsset);
      throw error;
    }

    return {
      mediaAsset: readyAsset,
      publicUrl: this.publicUrl(readyAsset.storagePath),
    };
  }

  private async persistUploadFailure(mediaAsset: MediaAsset, reason: string): Promise<void> {
    try {
      mediaAsset.markFailed(reason, new Date());
      await this.mediaRepository.save(mediaAsset);
    } catch {
      this.logger.error(
        `Não foi possível registrar a falha do ativo ${mediaAsset.id}; revisão operacional necessária.`,
      );
      throw new MediaStorageInconsistentError();
    }
  }

  private async rollbackUploadedObject(mediaAsset: MediaAsset): Promise<void> {
    let objectRemoved = false;
    let failurePersisted = false;

    try {
      await this.storage.remove(this.bucket, mediaAsset.storagePath);
      objectRemoved = true;
    } catch {
      this.logger.error(
        `Não foi possível remover o objeto do ativo ${mediaAsset.id}; revisão operacional necessária.`,
      );
    }

    try {
      mediaAsset.markFailed(METADATA_PERSISTENCE_FAILED, new Date());
      await this.mediaRepository.save(mediaAsset);
      failurePersisted = true;
    } catch {
      this.logger.error(
        `Não foi possível registrar o rollback do ativo ${mediaAsset.id}; revisão operacional necessária.`,
      );
    }

    if (!objectRemoved || !failurePersisted) {
      throw new MediaStorageInconsistentError();
    }
  }
}
