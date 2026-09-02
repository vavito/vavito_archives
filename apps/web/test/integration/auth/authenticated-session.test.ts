import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getAuthenticatedSession } from '@web/lib/auth/authenticated-session';

const authMocks = vi.hoisted(() => ({
  getClaims: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock('server-only', () => ({}));

vi.mock('@web/lib/auth/supabase/server', () => ({
  createServerSupabaseClient: () => Promise.resolve({ auth: authMocks }),
}));

describe('sessão autenticada no servidor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.getClaims.mockResolvedValue({
      data: { claims: { sub: 'profile-id' } },
      error: null,
    });
    authMocks.getSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'access-token',
          user: { email: 'leitor@example.com' },
        },
      },
      error: null,
    });
  });

  it('entrega apenas token e e-mail de uma sessão válida', async () => {
    await expect(getAuthenticatedSession()).resolves.toEqual({
      accessToken: 'access-token',
      email: 'leitor@example.com',
    });
  });

  it('rejeita uma sessão cujas claims não puderam ser validadas', async () => {
    authMocks.getClaims.mockResolvedValueOnce({ data: null, error: new Error('invalid') });

    await expect(getAuthenticatedSession()).resolves.toBeNull();
    expect(authMocks.getSession).not.toHaveBeenCalled();
  });

  it('rejeita uma sessão sem token de acesso', async () => {
    authMocks.getSession.mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });

    await expect(getAuthenticatedSession()).resolves.toBeNull();
  });
});
