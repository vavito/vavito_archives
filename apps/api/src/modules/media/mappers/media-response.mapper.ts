import type { MediaAsset } from '@api/modules/media/domain/entities/media-asset.entity';
import type { MediaResponseDto } from '@api/modules/media/dto/response/media-response.dto';

export class MediaResponseMapper {
  static toResponse(mediaAsset: MediaAsset, publicUrl: string): MediaResponseDto {
    return {
      altText: mediaAsset.altText,
      createdAt: mediaAsset.createdAt.toISOString(),
      height: mediaAsset.height,
      id: mediaAsset.id,
      mimeType: mediaAsset.mimeType,
      path: mediaAsset.storagePath,
      sizeBytes: mediaAsset.sizeBytes,
      status: mediaAsset.status,
      url: publicUrl,
      width: mediaAsset.width,
    };
  }
}
