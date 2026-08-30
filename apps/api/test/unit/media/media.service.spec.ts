import { Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';

import type { ApplicationConfig } from '@api/core/config/app.config';
import type { MediaAsset } from '@api/modules/media/domain/entities/media-asset.entity';
import { MediaAssetStatus } from '@api/modules/media/domain/enums/media-asset-status.enum';
import { MediaStorageInconsistentError } from '@api/modules/media/domain/errors/media-storage-inconsistent.error';
import type { MediaRepository } from '@api/modules/media/repositories/media.repository';
import { MediaService } from '@api/modules/media/services/media.service';

import { FakeStorageService } from '../../fakes/media/fake-storage.service';

const PROFILE_ID = '2cc721a8-2db5-4e7f-b68a-d807546b5206';

describe('MediaService', () => {
  const create = jest.fn<Promise<void>, [MediaAsset]>();
  const save = jest.fn<Promise<void>, [MediaAsset]>();
  const repository = { create, save } as unknown as MediaRepository;
  const storage = new FakeStorageService();
  const config = {
    get: jest.fn().mockReturnValue('media'),
  } as unknown as ConfigService<ApplicationConfig, true>;
  const service = new MediaService(repository, storage, config);
  const input = {
    altText: 'Imagem editorial',
    buffer: Buffer.from('valid-media'),
    createdById: PROFILE_ID,
    extension: 'webp',
    height: 720,
    mimeType: 'image/webp',
    width: 1280,
  };
  let loggerError: jest.SpyInstance;

  beforeAll(() => {
    loggerError = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    storage.reset();
  });

  afterAll(() => {
    loggerError.mockRestore();
  });

  it('reserva um path único, envia o objeto e persiste o ativo READY', async () => {
    create.mockImplementationOnce((mediaAsset) => {
      expect(mediaAsset.status).toBe(MediaAssetStatus.UPLOADING);
      return Promise.resolve();
    });

    const result = await service.upload(input);

    expect(storage.uploadAttempts).toHaveLength(1);
    const uploadedFile = storage.uploadAttempts[0];
    expect(uploadedFile).toMatchObject({
      bucket: 'media',
      buffer: input.buffer,
      contentType: 'image/webp',
    });
    expect(uploadedFile?.path).toMatch(
      /^\d{4}\/\d{2}\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.webp$/,
    );
    expect(result.mediaAsset.status).toBe(MediaAssetStatus.READY);
    expect(save).toHaveBeenCalledWith(result.mediaAsset);
    expect(result.publicUrl).toContain(result.mediaAsset.storagePath);
    expect(storage.hasObject('media', result.mediaAsset.storagePath)).toBe(true);
  });

  it('resolve a URL pública de um objeto do bucket de mídia', () => {
    expect(service.publicUrl('2026/08/capa.webp')).toBe(
      'https://storage.test/media/2026/08/capa.webp',
    );
  });

  it('registra FAILED quando o upload no Storage falha', async () => {
    const storageError = new Error('storage unavailable');
    storage.failNextUpload(storageError);

    await expect(service.upload(input)).rejects.toBe(storageError);

    const failedAsset = save.mock.calls[0]?.[0];
    expect(failedAsset?.status).toBe(MediaAssetStatus.FAILED);
    expect(failedAsset?.failureReason).toBe('Storage upload failed.');
    expect(storage.removeAttempts).toEqual([]);
  });

  it('remove o objeto e persiste FAILED quando os metadados READY não são salvos', async () => {
    const databaseError = new Error('database unavailable');
    save.mockRejectedValueOnce(databaseError).mockResolvedValueOnce(undefined);

    await expect(service.upload(input)).rejects.toBe(databaseError);

    expect(storage.removeAttempts).toHaveLength(1);
    expect(storage.removeAttempts[0]?.bucket).toBe('media');
    expect(storage.removeAttempts[0]?.path).toMatch(/\.webp$/);
    expect(save).toHaveBeenCalledTimes(2);
    expect(save.mock.calls[0]?.[0].status).toBe(MediaAssetStatus.READY);
    expect(save.mock.calls[1]?.[0].status).toBe(MediaAssetStatus.FAILED);
    expect(save.mock.calls[1]?.[0].failureReason).toBe('Metadata persistence failed.');
  });

  it('sinaliza inconsistência quando a remoção compensatória falha', async () => {
    save.mockRejectedValueOnce(new Error('database unavailable')).mockResolvedValueOnce(undefined);
    storage.failNextRemove(new Error('storage unavailable'));

    await expect(service.upload(input)).rejects.toBeInstanceOf(MediaStorageInconsistentError);
    expect(loggerError).toHaveBeenCalledWith(expect.stringContaining('revisão operacional'));
  });

  it('sinaliza inconsistência quando não consegue persistir a falha do upload', async () => {
    storage.failNextUpload(new Error('storage unavailable'));
    save.mockRejectedValueOnce(new Error('database unavailable'));

    await expect(service.upload(input)).rejects.toBeInstanceOf(MediaStorageInconsistentError);
  });
});
