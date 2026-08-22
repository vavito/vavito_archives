import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { ApplicationConfig } from '@api/core/config/app.config';
import { StorageService } from '@api/core/storage/services/storage.service';
import type { MediaAsset } from '@api/modules/media/domain/entities/media-asset.entity';
import { MediaStorageInconsistentError } from '@api/modules/media/domain/errors/media-storage-inconsistent.error';
import { MediaRepository } from '@api/modules/media/repositories/media.repository';

const HOUR_IN_MILLISECONDS = 60 * 60 * 1000;

export interface MediaCleanupOptions {
  dryRun: boolean;
  limit: number;
  olderThanHours: number;
}

export interface MediaCleanupSummary {
  cutoff: string;
  dryRun: boolean;
  failedIds: string[];
  markedOrphanedIds: string[];
  purgedIds: string[];
  restoredReferencedIds: string[];
  skippedReferencedIds: string[];
  wouldMarkOrphanedIds: string[];
  wouldPurgeIds: string[];
}

function emptySummary(cutoff: Date, dryRun: boolean): MediaCleanupSummary {
  return {
    cutoff: cutoff.toISOString(),
    dryRun,
    failedIds: [],
    markedOrphanedIds: [],
    purgedIds: [],
    restoredReferencedIds: [],
    skippedReferencedIds: [],
    wouldMarkOrphanedIds: [],
    wouldPurgeIds: [],
  };
}

function validateOptions(options: MediaCleanupOptions): void {
  if (
    !Number.isSafeInteger(options.olderThanHours) ||
    options.olderThanHours <= 0 ||
    !Number.isSafeInteger(options.limit) ||
    options.limit <= 0
  ) {
    throw new Error('Media cleanup options must use positive safe integers.');
  }
}

@Injectable()
export class MediaCleanupService {
  private readonly bucket: string;
  private readonly logger = new Logger(MediaCleanupService.name);

  constructor(
    private readonly mediaRepository: MediaRepository,
    private readonly storage: StorageService,
    configService: ConfigService<ApplicationConfig, true>,
  ) {
    this.bucket = configService.get('supabase.mediaBucket', { infer: true });
  }

  async cleanup(options: MediaCleanupOptions, now = new Date()): Promise<MediaCleanupSummary> {
    validateOptions(options);
    const cutoff = new Date(now.getTime() - options.olderThanHours * HOUR_IN_MILLISECONDS);

    if (!Number.isFinite(cutoff.getTime())) {
      throw new Error('Media cleanup cutoff is invalid.');
    }

    const readyAssets = await this.mediaRepository.findReadyWithoutPostReferencesBefore(
      cutoff,
      options.limit,
    );
    const orphanedAssets = await this.mediaRepository.findOrphanedBefore(cutoff, options.limit);
    const summary = emptySummary(cutoff, options.dryRun);

    for (const mediaAsset of readyAssets) {
      await this.processReadyAsset(mediaAsset, options.dryRun, now, summary);
    }

    for (const mediaAsset of orphanedAssets) {
      await this.processOrphanedAsset(mediaAsset, options.dryRun, now, summary);
    }

    this.logger.log(JSON.stringify({ event: 'media_orphan_cleanup', ...summary }));

    return summary;
  }

  private async processReadyAsset(
    mediaAsset: MediaAsset,
    dryRun: boolean,
    now: Date,
    summary: MediaCleanupSummary,
  ): Promise<void> {
    try {
      const hasPostReferences = await this.mediaRepository.hasPostReferences(mediaAsset.id);

      if (hasPostReferences) {
        summary.skippedReferencedIds.push(mediaAsset.id);
        return;
      }

      if (dryRun) {
        summary.wouldMarkOrphanedIds.push(mediaAsset.id);
        return;
      }

      mediaAsset.markOrphaned(now, false);
      await this.mediaRepository.save(mediaAsset);
      summary.markedOrphanedIds.push(mediaAsset.id);
    } catch {
      summary.failedIds.push(mediaAsset.id);
      this.logger.error(`Falha ao marcar o ativo ${mediaAsset.id} como órfão.`);
    }
  }

  private async processOrphanedAsset(
    mediaAsset: MediaAsset,
    dryRun: boolean,
    now: Date,
    summary: MediaCleanupSummary,
  ): Promise<void> {
    try {
      const hasPostReferences = await this.mediaRepository.hasPostReferences(mediaAsset.id);

      if (hasPostReferences) {
        if (dryRun) {
          summary.skippedReferencedIds.push(mediaAsset.id);
          return;
        }

        mediaAsset.restoreReference(now);
        await this.mediaRepository.save(mediaAsset);
        summary.restoredReferencedIds.push(mediaAsset.id);
        return;
      }

      mediaAsset.ensureCanPurge(false);

      if (dryRun) {
        summary.wouldPurgeIds.push(mediaAsset.id);
        return;
      }

      await this.storage.remove(this.bucket, mediaAsset.storagePath);
      const deleted = await this.mediaRepository.deleteIfOrphanedAndUnreferenced(mediaAsset.id);

      if (!deleted) {
        throw new MediaStorageInconsistentError();
      }

      summary.purgedIds.push(mediaAsset.id);
    } catch {
      summary.failedIds.push(mediaAsset.id);
      this.logger.error(`Falha ao remover o ativo órfão ${mediaAsset.id}.`);
    }
  }
}
