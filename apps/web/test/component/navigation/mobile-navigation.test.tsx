import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MobileNavigation } from '@web/components/navigation/mobile-navigation';

const navigationMocks = vi.hoisted(() => ({
  push: vi.fn(),
  usePathname: vi.fn(),
}));

const authMocks = vi.hoisted(() => ({
  getSession: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: navigationMocks.usePathname,
  useRouter: () => ({ push: navigationMocks.push }),
}));

vi.mock('@web/lib/auth/supabase/client', () => ({
  createBrowserSupabaseClient: () => ({ auth: authMocks }),
}));

describe('MobileNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigationMocks.usePathname.mockReturnValue('/');
    authMocks.getSession.mockResolvedValue({ data: { session: null }, error: null });
  });

  it('mantém somente o link da rota inicial como ativo', () => {
    render(<MobileNavigation />);

    expect(screen.getByRole('navigation', { name: 'Navegação móvel' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Início' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Artigos' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: 'Salvos' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: 'Perfil' })).not.toHaveAttribute('aria-current');
  });

  it('orienta o visitante a entrar antes de acessar os artigos salvos', async () => {
    render(<MobileNavigation />);

    fireEvent.click(screen.getByRole('link', { name: 'Salvos' }));

    expect(
      await screen.findByRole('heading', { name: 'Entre para ver seus artigos salvos' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/você precisa acessar sua conta/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir para o login' })).toHaveAttribute(
      'href',
      '/auth?next=/salvos',
    );
    expect(navigationMocks.push).not.toHaveBeenCalled();
  });

  it('encaminha o leitor autenticado para os artigos salvos', async () => {
    authMocks.getSession.mockResolvedValueOnce({
      data: { session: { access_token: 'access-token' } },
      error: null,
    });
    render(<MobileNavigation />);

    fireEvent.click(screen.getByRole('link', { name: 'Salvos' }));

    await waitFor(() => {
      expect(navigationMocks.push).toHaveBeenCalledWith('/salvos');
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
