import { Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';

import type { ApplicationConfig } from '@api/core/config/app.config';
import type { StorageService } from '@api/core/storage/services/storage.service';
import type { MediaAsset } from '@api/modules/media/domain/entities/media-asset.entity';
import { MediaAssetStatus } from '@api/modules/media/domain/enums/media-asset-status.enum';
import { MediaStorageInconsistentError } from '@api/modules/media/domain/errors/media-storage-inconsistent.error';
import type { MediaRepository } from '@api/modules/media/repositories/media.repository';
import { MediaService } from '@api/modules/media/services/media.service';

const PROFILE_ID = '2cc721a8-2db5-4e7f-b68a-d807546b5206';

describe('MediaService', () => {
  const create = jest.fn<Promise<void>, [MediaAsset]>();
  const save = jest.fn<Promise<void>, [MediaAsset]>();
  const upload = jest.fn<
    ReturnType<StorageService['upload']>,
    Parameters<StorageService['upload']>
  >();
  const remove = jest.fn<
    ReturnType<StorageService['remove']>,
    Parameters<StorageService['remove']>
  >();
  const publicUrl = jest.fn<
    ReturnType<StorageService['publicUrl']>,
    Parameters<StorageService['publicUrl']>
  >();
  const repository = { create, save } as unknown as MediaRepository;
  const storage = { publicUrl, remove, upload } as unknown as StorageService;
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
    publicUrl.mockImplementation(
      (_bucket: string, path: string) => `https://cdn.example/media/${path}`,
    );
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

    expect(upload).toHaveBeenCalledTimes(1);
    const uploadedFile = upload.mock.calls[0]?.[0];
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
  });

  it('registra FAILED quando o upload no Storage falha', async () => {
    const storageError = new Error('storage unavailable');
    upload.mockRejectedValueOnce(storageError);

    await expect(service.upload(input)).rejects.toBe(storageError);

    const failedAsset = save.mock.calls[0]?.[0];
    expect(failedAsset?.status).toBe(MediaAssetStatus.FAILED);
    expect(failedAsset?.failureReason).toBe('Storage upload failed.');
    expect(remove).not.toHaveBeenCalled();
  });

  it('remove o objeto e persiste FAILED quando os metadados READY não são salvos', async () => {
    const databaseError = new Error('database unavailable');
    save.mockRejectedValueOnce(databaseError).mockResolvedValueOnce(undefined);

    await expect(service.upload(input)).rejects.toBe(databaseError);

    expect(remove).toHaveBeenCalledTimes(1);
    expect(remove.mock.calls[0]?.[0]).toBe('media');
    expect(remove.mock.calls[0]?.[1]).toMatch(/\.webp$/);
    expect(save).toHaveBeenCalledTimes(2);
    expect(save.mock.calls[0]?.[0].status).toBe(MediaAssetStatus.READY);
    expect(save.mock.calls[1]?.[0].status).toBe(MediaAssetStatus.FAILED);
    expect(save.mock.calls[1]?.[0].failureReason).toBe('Metadata persistence failed.');
  });

  it('sinaliza inconsistência quando a remoção compensatória falha', async () => {
    save.mockRejectedValueOnce(new Error('database unavailable')).mockResolvedValueOnce(undefined);
    remove.mockRejectedValueOnce(new Error('storage unavailable'));

    await expect(service.upload(input)).rejects.toBeInstanceOf(MediaStorageInconsistentError);
    expect(loggerError).toHaveBeenCalledWith(expect.stringContaining('revisão operacional'));
  });

  it('sinaliza inconsistência quando não consegue persistir a falha do upload', async () => {
    upload.mockRejectedValueOnce(new Error('storage unavailable'));
    save.mockRejectedValueOnce(new Error('database unavailable'));

    await expect(service.upload(input)).rejects.toBeInstanceOf(MediaStorageInconsistentError);
  });
});
