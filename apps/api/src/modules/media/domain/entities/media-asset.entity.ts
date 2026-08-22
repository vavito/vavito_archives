import { MediaAssetStatus } from '@api/modules/media/domain/enums/media-asset-status.enum';
import { InvalidMediaStatusTransitionError } from '@api/modules/media/domain/errors/invalid-media-status-transition.error';
import { MediaMetadataInvalidError } from '@api/modules/media/domain/errors/media-metadata-invalid.error';
import { MediaNotOrphanedError } from '@api/modules/media/domain/errors/media-not-orphaned.error';
import { MediaStorageInconsistentError } from '@api/modules/media/domain/errors/media-storage-inconsistent.error';
import { MediaUploadRetryNotAllowedError } from '@api/modules/media/domain/errors/media-upload-retry-not-allowed.error';
import type { MediaMetadata } from '@api/modules/media/domain/value-objects/media-metadata.value-object';

export interface CreateMediaAssetProps {
  createdById: string;
  id: string;
  metadata: MediaMetadata;
  now: Date;
}

export interface RestoreMediaAssetProps {
  createdAt: Date;
  createdById: string;
  failureReason: string | null;
  id: string;
  metadata: MediaMetadata;
  orphanedAt: Date | null;
  status: MediaAssetStatus;
  updatedAt: Date;
}

function cloneDate(date: Date): Date {
  return new Date(date.getTime());
}

function validDate(date: Date): boolean {
  return Number.isFinite(date.getTime());
}

export class MediaAsset {
  private constructor(private readonly props: RestoreMediaAssetProps) {}

  static create(props: CreateMediaAssetProps): MediaAsset {
    if (!validDate(props.now)) {
      throw new MediaStorageInconsistentError();
    }

    return new MediaAsset({
      createdAt: cloneDate(props.now),
      createdById: props.createdById,
      failureReason: null,
      id: props.id,
      metadata: props.metadata,
      orphanedAt: null,
      status: MediaAssetStatus.UPLOADING,
      updatedAt: cloneDate(props.now),
    });
  }

  static restore(props: RestoreMediaAssetProps): MediaAsset {
    const asset = new MediaAsset({
      ...props,
      createdAt: cloneDate(props.createdAt),
      failureReason: props.failureReason?.trim() ?? null,
      orphanedAt: props.orphanedAt ? cloneDate(props.orphanedAt) : null,
      updatedAt: cloneDate(props.updatedAt),
    });

    asset.ensureStateIsConsistent();

    return asset;
  }

  get altText(): string {
    return this.props.metadata.altText;
  }

  get canBeAssociatedWithPost(): boolean {
    return this.props.status === MediaAssetStatus.READY;
  }

  get createdAt(): Date {
    return cloneDate(this.props.createdAt);
  }

  get createdById(): string {
    return this.props.createdById;
  }

  get failureReason(): string | null {
    return this.props.failureReason;
  }

  get height(): number | null {
    return this.props.metadata.height;
  }

  get id(): string {
    return this.props.id;
  }

  get metadata(): MediaMetadata {
    return this.props.metadata;
  }

  get mimeType(): string {
    return this.props.metadata.mimeType;
  }

  get orphanedAt(): Date | null {
    return this.props.orphanedAt ? cloneDate(this.props.orphanedAt) : null;
  }

  get sizeBytes(): number {
    return this.props.metadata.sizeBytes;
  }

  get status(): MediaAssetStatus {
    return this.props.status;
  }

  get storagePath(): string {
    return this.props.metadata.storagePath;
  }

  get updatedAt(): Date {
    return cloneDate(this.props.updatedAt);
  }

  get width(): number | null {
    return this.props.metadata.width;
  }

  markReady(metadata: MediaMetadata, now: Date): void {
    this.ensureStatus('mark ready', MediaAssetStatus.UPLOADING);

    if (!metadata.hasDimensions || !validDate(now)) {
      throw new MediaMetadataInvalidError();
    }

    this.props.failureReason = null;
    this.props.metadata = metadata;
    this.props.orphanedAt = null;
    this.props.status = MediaAssetStatus.READY;
    this.props.updatedAt = cloneDate(now);
  }

  markFailed(reason: string, now: Date): void {
    this.ensureStatus('mark failed', MediaAssetStatus.UPLOADING);
    const failureReason = reason.trim();

    if (failureReason.length === 0 || !validDate(now)) {
      throw new MediaStorageInconsistentError();
    }

    this.props.failureReason = failureReason;
    this.props.orphanedAt = null;
    this.props.status = MediaAssetStatus.FAILED;
    this.props.updatedAt = cloneDate(now);
  }

  retryUpload(now: Date): void {
    if (this.props.status !== MediaAssetStatus.FAILED) {
      throw new MediaUploadRetryNotAllowedError();
    }
    if (!validDate(now)) {
      throw new MediaStorageInconsistentError();
    }

    this.props.failureReason = null;
    this.props.status = MediaAssetStatus.UPLOADING;
    this.props.updatedAt = cloneDate(now);
  }

  markOrphaned(now: Date, hasPostReferences: boolean): void {
    this.ensureStatus('mark orphaned', MediaAssetStatus.READY);

    if (hasPostReferences) {
      throw new MediaNotOrphanedError();
    }
    if (!validDate(now)) {
      throw new MediaStorageInconsistentError();
    }

    this.props.orphanedAt = cloneDate(now);
    this.props.status = MediaAssetStatus.ORPHANED;
    this.props.updatedAt = cloneDate(now);
  }

  restoreReference(now: Date): void {
    this.ensureStatus('restore reference', MediaAssetStatus.ORPHANED);

    if (!validDate(now)) {
      throw new MediaStorageInconsistentError();
    }

    this.props.orphanedAt = null;
    this.props.status = MediaAssetStatus.READY;
    this.props.updatedAt = cloneDate(now);
  }

  ensureCanPurge(hasPostReferences: boolean): void {
    if (this.props.status !== MediaAssetStatus.ORPHANED || hasPostReferences) {
      throw new MediaNotOrphanedError();
    }
  }

  private ensureStateIsConsistent(): void {
    const failedStateIsConsistent =
      this.props.status === MediaAssetStatus.FAILED
        ? Boolean(this.props.failureReason)
        : this.props.failureReason === null;
    const orphanedStateIsConsistent =
      this.props.status === MediaAssetStatus.ORPHANED
        ? this.props.orphanedAt !== null
        : this.props.orphanedAt === null;
    const readyMetadataIsComplete =
      ![MediaAssetStatus.READY, MediaAssetStatus.ORPHANED].includes(this.props.status) ||
      this.props.metadata.hasDimensions;
    const datesAreConsistent =
      validDate(this.props.createdAt) &&
      validDate(this.props.updatedAt) &&
      this.props.updatedAt.getTime() >= this.props.createdAt.getTime() &&
      (!this.props.orphanedAt ||
        (validDate(this.props.orphanedAt) &&
          this.props.orphanedAt.getTime() >= this.props.createdAt.getTime()));

    if (
      !failedStateIsConsistent ||
      !orphanedStateIsConsistent ||
      !readyMetadataIsComplete ||
      !datesAreConsistent
    ) {
      throw new MediaStorageInconsistentError();
    }
  }

  private ensureStatus(action: string, expectedStatus: MediaAssetStatus): void {
    if (this.props.status !== expectedStatus) {
      throw new InvalidMediaStatusTransitionError(action, this.props.status);
    }
  }
}
