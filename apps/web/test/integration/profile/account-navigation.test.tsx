import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountNavigation } from '@web/components/navigation/account-navigation';

const accountMocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getProfile: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock('server-only', () => ({}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
}));

vi.mock('@web/features/profile', () => ({
  ProfileAvatar: ({ displayName }: { displayName: string }) => <span>{displayName}</span>,
  getProfile: accountMocks.getProfile,
}));

vi.mock('@web/lib/api/api-client', () => ({
  createWebAuthenticatedApiClient: accountMocks.createClient,
}));

vi.mock('@web/lib/auth/authenticated-session', () => ({
  getAuthenticatedSession: accountMocks.getSession,
}));

vi.mock('@web/lib/auth/supabase/client', () => ({
  createBrowserSupabaseClient: () => ({ auth: { signOut: vi.fn() } }),
}));

describe('navegação autenticada da conta', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    accountMocks.createClient.mockReturnValue({});
    accountMocks.getSession.mockResolvedValue(null);
  });

  it('apresenta a entrada para visitantes', async () => {
    render(await AccountNavigation());

    expect(screen.getByRole('link', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('apresenta o nome persistido para uma sessão autenticada', async () => {
    accountMocks.getSession.mockResolvedValueOnce({
      accessToken: 'access-token',
      email: 'joao@example.com',
    });
    accountMocks.getProfile.mockResolvedValueOnce({
      avatarUrl: null,
      displayName: 'João Victor',
    });

    render(await AccountNavigation());

    expect(screen.getByRole('button', { name: /João Victor/i })).toBeInTheDocument();
  });

  it('mantém a conta visível quando somente o perfil está indisponível', async () => {
    accountMocks.getSession.mockResolvedValueOnce({
      accessToken: 'access-token',
      email: 'joao@example.com',
    });
    accountMocks.getProfile.mockRejectedValueOnce(new Error('servidor indisponível'));

    render(await AccountNavigation());

    expect(screen.getByRole('button', { name: /joao/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Entrar' })).not.toBeInTheDocument();
  });
});
