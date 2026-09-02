import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountNavigationAction } from '@web/components/navigation/account-navigation-action';

const navigationMocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  replace: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => navigationMocks,
}));

vi.mock('@web/lib/auth/supabase/client', () => ({
  createBrowserSupabaseClient: () => ({ auth: { signOut: navigationMocks.signOut } }),
}));

describe('ação de conta do cabeçalho', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigationMocks.signOut.mockResolvedValue({ error: null });
  });

  it('oferece entrada somente quando não existe uma sessão', () => {
    render(<AccountNavigationAction account={null} />);

    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/auth');
  });

  it('mostra nome, foto e opções da conta sem abrir um modal', () => {
    render(<AccountNavigationAction account={{ avatarUrl: null, displayName: 'João Victor' }} />);

    fireEvent.click(screen.getByRole('button', { name: /João Victor/i }));

    expect(screen.getByRole('menu', { name: 'Opções da conta' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Minha Conta' })).toHaveAttribute(
      'href',
      '/perfil',
    );
    expect(screen.getByRole('menuitem', { name: 'Fazer Logout' })).toHaveClass('text-destructive');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('encerra a sessão e retorna à página inicial', async () => {
    render(<AccountNavigationAction account={{ avatarUrl: null, displayName: 'João Victor' }} />);

    fireEvent.click(screen.getByRole('button', { name: /João Victor/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Fazer Logout' }));

    await waitFor(() => {
      expect(navigationMocks.signOut).toHaveBeenCalledWith({ scope: 'local' });
      expect(navigationMocks.replace).toHaveBeenCalledWith('/');
      expect(navigationMocks.refresh).toHaveBeenCalled();
    });
  });
});
