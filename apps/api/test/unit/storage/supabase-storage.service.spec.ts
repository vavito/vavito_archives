import { Logger } from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';

import { StorageOperationError } from '@api/core/storage/errors/storage-operation.error';
import { SupabaseStorageService } from '@api/core/storage/services/supabase-storage.service';

describe('SupabaseStorageService', () => {
  const upload = jest.fn();
  const remove = jest.fn();
  const getPublicUrl = jest.fn();
  const from = jest.fn().mockReturnValue({ getPublicUrl, remove, upload });
  const supabase = { storage: { from } } as unknown as SupabaseClient;
  const service = new SupabaseStorageService(supabase);
  let loggerError: jest.SpyInstance;

  beforeAll(() => {
    loggerError = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    loggerError.mockRestore();
  });

  it('envia o objeto sem permitir sobrescrita silenciosa', async () => {
    upload.mockResolvedValueOnce({ data: { path: '2026/08/file.webp' }, error: null });
    const buffer = Buffer.from('media');

    await service.upload({
      bucket: 'media',
      buffer,
      contentType: 'image/webp',
      path: '2026/08/file.webp',
    });

    expect(from).toHaveBeenCalledWith('media');
    expect(upload).toHaveBeenCalledWith('2026/08/file.webp', buffer, {
      contentType: 'image/webp',
      upsert: false,
    });
  });

  it('remove o objeto indicado', async () => {
    remove.mockResolvedValueOnce({ data: [], error: null });

    await service.remove('media', '2026/08/file.webp');

    expect(from).toHaveBeenCalledWith('media');
    expect(remove).toHaveBeenCalledWith(['2026/08/file.webp']);
  });

  it('deriva a URL pública sem persistir credenciais', () => {
    getPublicUrl.mockReturnValueOnce({
      data: { publicUrl: 'https://cdn.example/media/2026/08/file.webp' },
    });

    expect(service.publicUrl('media', '2026/08/file.webp')).toBe(
      'https://cdn.example/media/2026/08/file.webp',
    );
  });

  it('encapsula falhas do provedor sem registrar a causa potencialmente sensível', async () => {
    upload.mockResolvedValueOnce({ data: null, error: new Error('provider detail') });

    await expect(
      service.upload({
        bucket: 'media',
        buffer: Buffer.from('media'),
        contentType: 'image/webp',
        path: '2026/08/file.webp',
      }),
    ).rejects.toBeInstanceOf(StorageOperationError);
    expect(loggerError).toHaveBeenCalledWith(
      'Falha ao enviar objeto ao bucket media no path 2026/08/file.webp.',
    );
    expect(JSON.stringify(loggerError.mock.calls)).not.toContain('provider detail');
  });
});
