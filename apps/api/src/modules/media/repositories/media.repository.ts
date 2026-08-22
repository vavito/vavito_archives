import type { MediaAsset } from '@api/modules/media/domain/entities/media-asset.entity';

export abstract class MediaRepository {
  abstract create(mediaAsset: MediaAsset): Promise<void>;
  abstract deleteIfOrphanedAndUnreferenced(id: string): Promise<boolean>;
  abstract findById(id: string): Promise<MediaAsset | null>;
  abstract findByStoragePath(storagePath: string): Promise<MediaAsset | null>;
  abstract findOrphanedBefore(cutoff: Date, limit: number): Promise<MediaAsset[]>;
  abstract findReadyWithoutPostReferencesBefore(cutoff: Date, limit: number): Promise<MediaAsset[]>;
  abstract hasPostReferences(id: string): Promise<boolean>;
  abstract save(mediaAsset: MediaAsset): Promise<void>;
}
