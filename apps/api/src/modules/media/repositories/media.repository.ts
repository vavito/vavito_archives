import type { MediaAsset } from '@api/modules/media/domain/entities/media-asset.entity';

export abstract class MediaRepository {
  abstract create(mediaAsset: MediaAsset): Promise<void>;
  abstract findById(id: string): Promise<MediaAsset | null>;
  abstract findByStoragePath(storagePath: string): Promise<MediaAsset | null>;
  abstract hasPostReferences(id: string): Promise<boolean>;
  abstract save(mediaAsset: MediaAsset): Promise<void>;
}
