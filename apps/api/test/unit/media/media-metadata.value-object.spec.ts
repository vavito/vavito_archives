import { MediaAltTextRequiredError } from '@api/modules/media/domain/errors/media-alt-text-required.error';
import { MediaMetadataInvalidError } from '@api/modules/media/domain/errors/media-metadata-invalid.error';
import {
  MAX_MEDIA_SIZE_BYTES,
  MediaMetadata,
  type MediaMetadataProps,
} from '@api/modules/media/domain/value-objects/media-metadata.value-object';

const STORAGE_PATH = '2026/08/957c8388-cb96-4f0c-98b3-56b84c1fe67e.webp';

function metadataProps(overrides: Partial<MediaMetadataProps> = {}): MediaMetadataProps {
  return {
    altText: '  Capa   do artigo  ',
    height: 1080,
    mimeType: 'image/webp',
    sizeBytes: 1024,
    storagePath: STORAGE_PATH,
    width: 1920,
    ...overrides,
  };
}

describe('MediaMetadata', () => {
  it('normaliza alt text, MIME e path válidos', () => {
    const metadata = MediaMetadata.create(
      metadataProps({ mimeType: ' IMAGE/WEBP ', storagePath: ` ${STORAGE_PATH} ` }),
    );

    expect(metadata.altText).toBe('Capa do artigo');
    expect(metadata.mimeType).toBe('image/webp');
    expect(metadata.storagePath).toBe(STORAGE_PATH);
    expect(metadata.hasDimensions).toBe(true);
  });

  it('permite metadados preliminares sem dimensões durante o upload', () => {
    const metadata = MediaMetadata.create(metadataProps({ height: null, width: null }));

    expect(metadata.hasDimensions).toBe(false);
  });

  it.each([
    ['path fora do padrão', { storagePath: 'posts/capa.webp' }],
    ['extensão incompatível', { storagePath: STORAGE_PATH.replace('.webp', '.png') }],
    ['MIME não suportado', { mimeType: 'image/gif' }],
    ['arquivo vazio', { sizeBytes: 0 }],
    ['arquivo acima do limite', { sizeBytes: MAX_MEDIA_SIZE_BYTES + 1 }],
    ['largura inválida', { width: 0 }],
    ['dimensões incompletas', { height: null }],
  ] as const)('rejeita %s', (_scenario, overrides) => {
    expect(() => MediaMetadata.create(metadataProps(overrides))).toThrow(MediaMetadataInvalidError);
  });

  it('rejeita alt text vazio após normalização', () => {
    expect(() => MediaMetadata.create(metadataProps({ altText: '   ' }))).toThrow(
      MediaAltTextRequiredError,
    );
  });
});
