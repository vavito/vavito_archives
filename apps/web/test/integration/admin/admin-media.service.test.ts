import { beforeEach, describe, expect, it, vi } from 'vitest';

interface UploadCallOptions {
  getAccessToken: () => Promise<string | null | undefined>;
  onProgress?: (progress: unknown) => void;
  signal?: AbortSignal;
  timeoutMs?: number;
}

type UploadFormDataMock = (
  path: string,
  formData: FormData,
  options: UploadCallOptions,
) => Promise<unknown>;

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  uploadAuthenticatedFormData: vi.fn<UploadFormDataMock>(),
}));

vi.mock('@web/lib/auth/supabase/client', () => ({
  createBrowserSupabaseClient: () => ({ auth: { getSession: mocks.getSession } }),
}));

vi.mock('@web/lib/api/upload-form-data', () => ({
  uploadAuthenticatedFormData: mocks.uploadAuthenticatedFormData,
}));

import { uploadArticleImage } from '@web/features/admin/services/admin-media.service';

const apiMedia = {
  altText: 'Diagrama da aplicação',
  createdAt: '2026-09-05T12:00:00.000Z',
  height: 630,
  id: '019c2d62-6e90-7000-8000-000000000020',
  mimeType: 'image/webp',
  path: '2026/09/id.webp',
  sizeBytes: 153_642,
  status: 'READY',
  url: 'https://cdn.example.com/media/id.webp',
  width: 1200,
};

describe('serviço de mídia administrativa', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({
      data: { session: { access_token: 'admin-token' } },
      error: null,
    });
    mocks.uploadAuthenticatedFormData.mockResolvedValue(apiMedia);
  });

  it('envia arquivo e descrição com a sessão administrativa', async () => {
    const file = new File(['imagem'], 'diagrama.webp', { type: 'image/webp' });
    const onProgress = vi.fn();
    const signal = new AbortController().signal;

    await expect(
      uploadArticleImage(file, 'Diagrama da aplicação', { onProgress, signal }),
    ).resolves.toMatchObject({
      altText: apiMedia.altText,
      height: 630,
      id: apiMedia.id,
      mimeType: 'image/webp',
      url: apiMedia.url,
      width: 1200,
    });

    expect(mocks.uploadAuthenticatedFormData).toHaveBeenCalledWith(
      '/api/v1/admin/media',
      expect.any(FormData),
      expect.objectContaining({ onProgress, signal, timeoutMs: 30_000 }),
    );
    const [, formData, uploadOptions] = mocks.uploadAuthenticatedFormData.mock.calls[0]!;
    expect(formData.get('file')).toBe(file);
    expect(formData.get('altText')).toBe('Diagrama da aplicação');
    await expect(uploadOptions.getAccessToken()).resolves.toBe('admin-token');
  });

  it('rejeita uma resposta que não representa a mídia armazenada', async () => {
    mocks.uploadAuthenticatedFormData.mockResolvedValueOnce({ id: apiMedia.id });

    await expect(
      uploadArticleImage(new File(['imagem'], 'imagem.png', { type: 'image/png' }), 'Imagem'),
    ).rejects.toThrow('Não foi possível confirmar a imagem enviada.');
  });
});
