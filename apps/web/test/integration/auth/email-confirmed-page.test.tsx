import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import EmailConfirmedPage from '@web/app/(auth)/auth/confirmed/page';

const confirmedPageMocks = vi.hoisted(() => ({
  getAuthenticatedSession: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock('@web/lib/auth/authenticated-session', () => ({
  getAuthenticatedSession: confirmedPageMocks.getAuthenticatedSession,
}));

vi.mock('next/navigation', () => ({
  redirect: confirmedPageMocks.redirect,
}));

describe('página de e-mail confirmado', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    confirmedPageMocks.getAuthenticatedSession.mockResolvedValue({
      accessToken: 'access-token',
      email: 'leitor@example.com',
    });
    confirmedPageMocks.redirect.mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });
  });

  it('confirma que a conta está pronta antes de levar o leitor ao perfil', async () => {
    render(await EmailConfirmedPage());

    expect(
      screen.getByRole('heading', { name: 'E-mail confirmado com sucesso!' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Acessar minha conta' })).toHaveAttribute(
      'href',
      '/perfil',
    );
  });

  it('não apresenta sucesso sem uma sessão confirmada', async () => {
    confirmedPageMocks.getAuthenticatedSession.mockResolvedValueOnce(null);

    await expect(EmailConfirmedPage()).rejects.toThrow('NEXT_REDIRECT');
    expect(confirmedPageMocks.redirect).toHaveBeenCalledWith(
      '/auth?auth_error=confirmation_failed',
    );
  });
});
