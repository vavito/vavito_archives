import { beforeEach, describe, expect, it, vi } from 'vitest';

import AuthPage from '@web/app/(auth)/auth/page';

const authPageMocks = vi.hoisted(() => ({
  getAuthenticatedSession: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock('@web/lib/auth/authenticated-session', () => ({
  getAuthenticatedSession: authPageMocks.getAuthenticatedSession,
}));

vi.mock('next/navigation', () => ({
  redirect: authPageMocks.redirect,
}));

describe('página de autenticação', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authPageMocks.getAuthenticatedSession.mockResolvedValue(null);
    authPageMocks.redirect.mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });
  });

  it('redireciona uma sessão já autenticada para o perfil', async () => {
    authPageMocks.getAuthenticatedSession.mockResolvedValueOnce({
      accessToken: 'access-token',
      email: 'leitor@example.com',
    });

    await expect(AuthPage({ searchParams: Promise.resolve({}) })).rejects.toThrow('NEXT_REDIRECT');
    expect(authPageMocks.redirect).toHaveBeenCalledWith('/perfil');
  });

  it('preserva um destino interno solicitado pelo fluxo', async () => {
    authPageMocks.getAuthenticatedSession.mockResolvedValueOnce({
      accessToken: 'access-token',
      email: 'leitor@example.com',
    });

    await expect(AuthPage({ searchParams: Promise.resolve({ next: '/artigos' }) })).rejects.toThrow(
      'NEXT_REDIRECT',
    );
    expect(authPageMocks.redirect).toHaveBeenCalledWith('/artigos');
  });
});
