import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requireAdminSession } from '@web/features/admin/services/admin-session.service';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getProfile: vi.fn(),
  getSession: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('@web/features/profile', () => ({ getProfile: mocks.getProfile }));
vi.mock('@web/lib/api/api-client', () => ({
  createWebAuthenticatedApiClient: mocks.createClient,
}));
vi.mock('@web/lib/auth/authenticated-session', () => ({
  getAuthenticatedSession: mocks.getSession,
}));

describe('sessão administrativa', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createClient.mockReturnValue({});
    mocks.redirect.mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });
  });

  it('envia visitantes para o login', async () => {
    mocks.getSession.mockResolvedValue(null);

    await expect(requireAdminSession()).rejects.toThrow('NEXT_REDIRECT');
    expect(mocks.redirect).toHaveBeenCalledWith('/auth?next=/admin');
    expect(mocks.getProfile).not.toHaveBeenCalled();
  });

  it('envia leitores autenticados para a página de acesso não autorizado', async () => {
    mocks.getSession.mockResolvedValue({ accessToken: 'reader-token' });
    mocks.getProfile.mockResolvedValue({ role: 'USER' });

    await expect(requireAdminSession()).rejects.toThrow('NEXT_REDIRECT');
    expect(mocks.redirect).toHaveBeenCalledWith('/unauthorized');
  });

  it('mantém administradores na área restrita', async () => {
    const session = { accessToken: 'admin-token' };
    mocks.getSession.mockResolvedValue(session);
    mocks.getProfile.mockResolvedValue({ role: 'ADMIN' });

    await expect(requireAdminSession()).resolves.toEqual(session);
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
