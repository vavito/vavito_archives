import { MediaAsset } from '@api/modules/media/domain/entities/media-asset.entity';
import { MediaAssetStatus } from '@api/modules/media/domain/enums/media-asset-status.enum';
import { InvalidMediaStatusTransitionError } from '@api/modules/media/domain/errors/invalid-media-status-transition.error';
import { MediaMetadataInvalidError } from '@api/modules/media/domain/errors/media-metadata-invalid.error';
import { MediaNotOrphanedError } from '@api/modules/media/domain/errors/media-not-orphaned.error';
import { MediaStorageInconsistentError } from '@api/modules/media/domain/errors/media-storage-inconsistent.error';
import { MediaUploadRetryNotAllowedError } from '@api/modules/media/domain/errors/media-upload-retry-not-allowed.error';
import { MediaMetadata } from '@api/modules/media/domain/value-objects/media-metadata.value-object';

const CREATED_AT = new Date('2026-08-20T10:00:00.000Z');
const STORAGE_PATH = '2026/08/957c8388-cb96-4f0c-98b3-56b84c1fe67e.webp';

function metadata(withDimensions = true): MediaMetadata {
  return MediaMetadata.create({
    altText: 'Capa do artigo',
    height: withDimensions ? 1080 : null,
    mimeType: 'image/webp',
    sizeBytes: 1024,
    storagePath: STORAGE_PATH,
    width: withDimensions ? 1920 : null,
  });
}

function createAsset(): MediaAsset {
  return MediaAsset.create({
    createdById: 'ad4ce1ef-339f-45dc-bb91-a2f7ffbf3026',
    id: '5eac0bce-dd6f-4b48-a90d-e36361580783',
    metadata: metadata(false),
    now: CREATED_AT,
  });
}

function readyAsset(): MediaAsset {
  const asset = createAsset();
  asset.markReady(metadata(), new Date('2026-08-20T10:01:00.000Z'));
  return asset;
}

describe('MediaAsset', () => {
  it('cria mídia sem associação com post no estado UPLOADING', () => {
    const asset = createAsset();

    expect(asset.status).toBe(MediaAssetStatus.UPLOADING);
    expect(asset.canBeAssociatedWithPost).toBe(false);
    expect(asset.failureReason).toBeNull();
    expect(asset.orphanedAt).toBeNull();
    expect(asset.createdAt).toEqual(CREATED_AT);
  });

  it('marca como READY somente com metadados completos', () => {
    const asset = createAsset();
    const readyAt = new Date('2026-08-20T10:01:00.000Z');

    asset.markReady(metadata(), readyAt);

    expect(asset.status).toBe(MediaAssetStatus.READY);
    expect(asset.canBeAssociatedWithPost).toBe(true);
    expect(asset.width).toBe(1920);
    expect(asset.height).toBe(1080);
    expect(asset.updatedAt).toEqual(readyAt);
  });

  it('rejeita READY sem dimensões da imagem', () => {
    const asset = createAsset();

    expect(() => asset.markReady(metadata(false), new Date())).toThrow(MediaMetadataInvalidError);
    expect(asset.status).toBe(MediaAssetStatus.UPLOADING);
  });

  it('registra falha e permite uma nova tentativa explícita', () => {
    const asset = createAsset();

    asset.markFailed('  Storage indisponível  ', new Date('2026-08-20T10:01:00.000Z'));

    expect(asset.status).toBe(MediaAssetStatus.FAILED);
    expect(asset.failureReason).toBe('Storage indisponível');

    asset.retryUpload(new Date('2026-08-20T10:02:00.000Z'));

    expect(asset.status).toBe(MediaAssetStatus.UPLOADING);
    expect(asset.failureReason).toBeNull();
  });

  it('rejeita nova tentativa fora de FAILED', () => {
    expect(() => createAsset().retryUpload(new Date())).toThrow(MediaUploadRetryNotAllowedError);
  });

  it('marca READY sem referências como ORPHANED e bloqueia associação', () => {
    const asset = readyAsset();
    const orphanedAt = new Date('2026-08-21T10:00:00.000Z');

    asset.markOrphaned(orphanedAt, false);

    expect(asset.status).toBe(MediaAssetStatus.ORPHANED);
    expect(asset.orphanedAt).toEqual(orphanedAt);
    expect(asset.canBeAssociatedWithPost).toBe(false);
    expect(() => asset.ensureCanPurge(false)).not.toThrow();
  });

  it('não marca como ORPHANED nem permite purge quando há referência a post', () => {
    const asset = readyAsset();

    expect(() => asset.markOrphaned(new Date(), true)).toThrow(MediaNotOrphanedError);
    expect(asset.status).toBe(MediaAssetStatus.READY);
    expect(() => asset.ensureCanPurge(true)).toThrow(MediaNotOrphanedError);
  });

  it('restaura a referência de ORPHANED para READY', () => {
    const asset = readyAsset();
    asset.markOrphaned(new Date('2026-08-21T10:00:00.000Z'), false);

    asset.restoreReference(new Date('2026-08-21T11:00:00.000Z'));

    expect(asset.status).toBe(MediaAssetStatus.READY);
    expect(asset.orphanedAt).toBeNull();
    expect(asset.canBeAssociatedWithPost).toBe(true);
  });

  it.each([
    ['marcar READY novamente', () => readyAsset().markReady(metadata(), new Date())],
    ['marcar FAILED após READY', () => readyAsset().markFailed('Falha', new Date())],
    ['marcar UPLOADING como órfã', () => createAsset().markOrphaned(new Date(), false)],
    ['restaurar referência de READY', () => readyAsset().restoreReference(new Date())],
  ] as const)('rejeita transição inválida ao %s', (_scenario, transition) => {
    expect(transition).toThrow(InvalidMediaStatusTransitionError);
  });

  it('rejeita restauração com campos incompatíveis com o estado', () => {
    expect(() =>
      MediaAsset.restore({
        createdAt: CREATED_AT,
        createdById: 'ad4ce1ef-339f-45dc-bb91-a2f7ffbf3026',
        failureReason: null,
        id: '5eac0bce-dd6f-4b48-a90d-e36361580783',
        metadata: metadata(),
        orphanedAt: null,
        status: MediaAssetStatus.FAILED,
        updatedAt: CREATED_AT,
      }),
    ).toThrow(MediaStorageInconsistentError);
  });

  it('protege datas contra mutação externa', () => {
    const now = new Date(CREATED_AT);
    const asset = MediaAsset.create({
      createdById: 'ad4ce1ef-339f-45dc-bb91-a2f7ffbf3026',
      id: '5eac0bce-dd6f-4b48-a90d-e36361580783',
      metadata: metadata(false),
      now,
    });

    now.setUTCFullYear(2030);
    const returnedCreatedAt = asset.createdAt;
    returnedCreatedAt.setUTCFullYear(2031);

    expect(asset.createdAt).toEqual(CREATED_AT);
  });
});
