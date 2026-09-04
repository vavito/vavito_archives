import { ApiClientError, type ApiClient } from '@vavito/api-client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  deleteProfileAccountAction,
  removeProfileAvatarAction,
  updateProfileNameAction,
  uploadProfileAvatarAction,
} from '@web/features/profile/actions/profile.actions';
import { WEB_API_UPLOAD_REQUEST_TIMEOUT_MS } from '@web/lib/api/page-data-timeout';

const actionMocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  deleteProfileAccount: vi.fn(),
  getSession: vi.fn(),
  removeProfileAvatar: vi.fn(),
  revalidatePath: vi.fn(),
  updateProfileName: vi.fn(),
  uploadProfileAvatar: vi.fn(),
}));

vi.mock('server-only', () => ({}));

vi.mock('next/cache', () => ({
  revalidatePath: actionMocks.revalidatePath,
}));

vi.mock('@web/lib/auth/authenticated-session', () => ({
  getAuthenticatedSession: actionMocks.getSession,
}));

vi.mock('@web/lib/api/api-client', () => ({
  createWebAuthenticatedApiClient: actionMocks.createClient,
}));

vi.mock('@web/features/profile/services/profile-api.service', () => ({
  DELETE_ACCOUNT_CONFIRMATION: 'EXCLUIR MINHA CONTA',
  deleteProfileAccount: actionMocks.deleteProfileAccount,
  removeProfileAvatar: actionMocks.removeProfileAvatar,
  updateProfileName: actionMocks.updateProfileName,
  uploadProfileAvatar: actionMocks.uploadProfileAvatar,
}));

const client = {} as ApiClient;
const profile = {
  avatarUrl: null,
  createdAt: '2026-08-12T20:15:00.000Z',
  displayName: 'Maria Silva',
  id: '019c2d62-6e90-7000-8000-000000000001',
  role: 'USER' as const,
  updatedAt: '2026-09-02T12:00:00.000Z',
};

describe('ações autenticadas do perfil', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    actionMocks.createClient.mockReturnValue(client);
    actionMocks.getSession.mockResolvedValue({
      accessToken: 'access-token',
      email: 'leitor@example.com',
    });
    actionMocks.updateProfileName.mockResolvedValue(profile);
    actionMocks.uploadProfileAvatar.mockResolvedValue(profile);
    actionMocks.removeProfileAvatar.mockResolvedValue(undefined);
    actionMocks.deleteProfileAccount.mockResolvedValue(undefined);
  });

  it('valida e normaliza o nome novamente no servidor', async () => {
    await expect(updateProfileNameAction('  Maria   Silva  ')).resolves.toEqual({
      data: profile,
      ok: true,
    });
    expect(actionMocks.updateProfileName).toHaveBeenCalledWith('Maria Silva', client);
    expect(actionMocks.revalidatePath).toHaveBeenCalledWith('/perfil');

    await expect(updateProfileNameAction('J')).resolves.toEqual({
      message: 'Informe seu nome com pelo menos 2 caracteres.',
      ok: false,
    });
  });

  it('rejeita a mutação quando a sessão não está mais disponível', async () => {
    actionMocks.getSession.mockResolvedValueOnce(null);

    await expect(updateProfileNameAction('Maria Silva')).resolves.toEqual({
      message: 'Sua sessão expirou. Entre novamente para continuar.',
      ok: false,
    });
    expect(actionMocks.updateProfileName).not.toHaveBeenCalled();
  });

  it('valida e envia um avatar permitido pelo servidor do frontend', async () => {
    const file = new File(['avatar'], 'avatar.webp', { type: 'image/webp' });

    await expect(uploadProfileAvatarAction(file)).resolves.toEqual({ data: profile, ok: true });
    expect(actionMocks.createClient).toHaveBeenCalledWith(
      expect.any(Function),
      WEB_API_UPLOAD_REQUEST_TIMEOUT_MS,
    );
    expect(actionMocks.uploadProfileAvatar).toHaveBeenCalledWith(file, client);
  });

  it('retorna uma mensagem segura quando a API rejeita a ação', async () => {
    actionMocks.removeProfileAvatar.mockRejectedValueOnce(
      new ApiClientError({
        code: 'PROFILE_INTEGRATION_ERROR',
        details: null,
        message: 'Não foi possível remover sua foto agora.',
        path: '/api/v1/profiles/me/avatar',
        requestId: null,
        statusCode: 503,
        timestamp: null,
      }),
    );

    await expect(removeProfileAvatarAction()).resolves.toEqual({
      message: 'Não foi possível remover sua foto agora.',
      ok: false,
    });
  });

  it('exige confirmação exata antes de excluir a conta', async () => {
    await expect(deleteProfileAccountAction('excluir')).resolves.toEqual({
      message: 'Digite a confirmação exatamente como exibida.',
      ok: false,
    });
    expect(actionMocks.deleteProfileAccount).not.toHaveBeenCalled();

    await expect(deleteProfileAccountAction('EXCLUIR MINHA CONTA')).resolves.toEqual({
      data: undefined,
      ok: true,
    });
    expect(actionMocks.deleteProfileAccount).toHaveBeenCalledWith(client);
  });
});
