import type { ApiClient } from '@vavito/api-client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DELETE_ACCOUNT_CONFIRMATION,
  deleteProfileAccount,
  getProfile,
  removeProfileAvatar,
  updateProfileName,
  uploadProfileAvatar,
} from '@web/features/profile/services/profile-api.service';

const apiMocks = {
  DELETE: vi.fn(),
  GET: vi.fn(),
  PATCH: vi.fn(),
  PUT: vi.fn(),
};

const client = apiMocks as unknown as ApiClient;
const profileResponse = {
  avatarUrl: 'https://cdn.example.com/avatar.webp',
  createdAt: '2026-08-12T20:15:00.000Z',
  displayName: 'João Victor',
  id: '019c2d62-6e90-7000-8000-000000000001',
  role: 'USER' as const,
  updatedAt: '2026-09-02T12:00:00.000Z',
};

describe('serviço de perfil', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMocks.DELETE.mockResolvedValue({ data: undefined });
    apiMocks.GET.mockResolvedValue({ data: profileResponse });
    apiMocks.PATCH.mockResolvedValue({ data: profileResponse });
    apiMocks.PUT.mockResolvedValue({ data: profileResponse });
  });

  it('consulta o perfil autenticado e preserva a URL do avatar', async () => {
    await expect(getProfile(client)).resolves.toEqual(profileResponse);
    expect(apiMocks.GET).toHaveBeenCalledWith('/api/v1/profiles/me');
  });

  it('normaliza avatar ausente como nulo', async () => {
    apiMocks.GET.mockResolvedValueOnce({ data: { ...profileResponse, avatarUrl: undefined } });

    await expect(getProfile(client)).resolves.toMatchObject({ avatarUrl: null });
  });

  it('atualiza somente o nome público', async () => {
    await updateProfileName('Novo Nome', client);

    expect(apiMocks.PATCH).toHaveBeenCalledWith('/api/v1/profiles/me', {
      body: { displayName: 'Novo Nome' },
    });
  });

  it('serializa o avatar como formulário multipart', async () => {
    const file = new File(['avatar'], 'avatar.webp', { type: 'image/webp' });

    await uploadProfileAvatar(file, client);

    const options = apiMocks.PUT.mock.calls[0]?.[1] as {
      bodySerializer: () => FormData;
    };
    const formData = options.bodySerializer();

    expect(apiMocks.PUT).toHaveBeenCalledWith(
      '/api/v1/profiles/me/avatar',
      expect.objectContaining({ body: { file } }),
    );
    expect(formData.get('file')).toBe(file);
  });

  it('remove somente o avatar', async () => {
    await removeProfileAvatar(client);

    expect(apiMocks.DELETE).toHaveBeenCalledWith('/api/v1/profiles/me/avatar');
  });

  it('exige a frase oficial ao excluir a conta', async () => {
    await deleteProfileAccount(client);

    expect(apiMocks.DELETE).toHaveBeenCalledWith('/api/v1/profiles/me', {
      body: { confirmation: DELETE_ACCOUNT_CONFIRMATION },
    });
  });
});
