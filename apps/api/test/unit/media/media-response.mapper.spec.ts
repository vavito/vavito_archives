import { MediaAsset } from '@api/modules/media/domain/entities/media-asset.entity';
import { MediaMetadata } from '@api/modules/media/domain/value-objects/media-metadata.value-object';
import { MediaResponseMapper } from '@api/modules/media/mappers/media-response.mapper';

describe('MediaResponseMapper', () => {
  it('expõe o contrato público sem dados internos de falha ou autoria', () => {
    const now = new Date('2026-08-22T12:00:00.000Z');
    const metadata = MediaMetadata.create({
      altText: 'Diagrama da arquitetura',
      height: null,
      mimeType: 'image/webp',
      sizeBytes: 512,
      storagePath: '2026/08/c973827a-50b0-49d4-b319-38befde39f10.webp',
      width: null,
    });
    const mediaAsset = MediaAsset.create({
      createdById: 'b2f392b5-a63c-4544-8952-e9fa43b065b7',
      id: 'c973827a-50b0-49d4-b319-38befde39f10',
      metadata,
      now,
    });
    mediaAsset.markReady(
      MediaMetadata.create({
        altText: metadata.altText,
        height: 630,
        mimeType: metadata.mimeType,
        sizeBytes: metadata.sizeBytes,
        storagePath: metadata.storagePath,
        width: 1200,
      }),
      now,
    );

    expect(MediaResponseMapper.toResponse(mediaAsset, 'https://cdn.example/media.webp')).toEqual({
      altText: 'Diagrama da arquitetura',
      createdAt: now.toISOString(),
      height: 630,
      id: mediaAsset.id,
      mimeType: 'image/webp',
      path: metadata.storagePath,
      sizeBytes: 512,
      status: 'READY',
      url: 'https://cdn.example/media.webp',
      width: 1200,
    });
  });
});
