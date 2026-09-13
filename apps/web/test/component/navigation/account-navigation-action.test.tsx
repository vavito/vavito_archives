import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountNavigationAction } from '@web/components/navigation/account-navigation-action';

const navigationMocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  replace: vi.fn(),
  signOutSession: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => navigationMocks,
}));

vi.mock('@web/features/auth/session', () => ({
  signOutSession: navigationMocks.signOutSession,
}));

describe('ação de conta do cabeçalho', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigationMocks.signOutSession.mockResolvedValue(undefined);
  });

  it('oferece entrada somente quando não existe uma sessão', () => {
    render(<AccountNavigationAction account={null} />);

    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/auth');
  });

  it('mostra nome, foto e opções da conta sem abrir um modal', () => {
    render(
      <AccountNavigationAction
        account={{ avatarUrl: null, displayName: 'João Victor', isAdmin: false }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /João Victor/i }));

    expect(screen.getByRole('menu', { name: 'Opções da conta' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Minha Conta' })).toHaveAttribute(
      'href',
      '/perfil',
    );
    expect(screen.getByRole('menuitem', { name: 'Fazer Logout' })).toHaveClass('text-destructive');
    expect(screen.getByRole('menuitem', { name: 'Artigos salvos' })).toHaveAttribute(
      'href',
      '/salvos',
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Ir para o painel de administração' }),
    ).not.toBeInTheDocument();
  });

  it('mostra o acesso ao painel somente para a conta administrativa', () => {
    render(
      <AccountNavigationAction
        account={{ avatarUrl: null, displayName: 'João Victor', isAdmin: true }}
      />,
    );

    expect(screen.getByRole('link', { name: 'Ir para o painel de administração' })).toHaveAttribute(
      'href',
      '/admin/posts',
    );
  });

  it('encerra a sessão e retorna à página inicial', async () => {
    render(
      <AccountNavigationAction
        account={{ avatarUrl: null, displayName: 'João Victor', isAdmin: false }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /João Victor/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Fazer Logout' }));

    await waitFor(() => {
      expect(navigationMocks.signOutSession).toHaveBeenCalledOnce();
      expect(navigationMocks.replace).toHaveBeenCalledWith('/');
      expect(navigationMocks.refresh).toHaveBeenCalled();
    });
  });

  it('permite repetir a saída quando a conexão falha sem expor detalhes', async () => {
    navigationMocks.signOutSession.mockRejectedValueOnce(
      new Error('fetch failed with private details'),
    );
    render(
      <AccountNavigationAction
        account={{ avatarUrl: null, displayName: 'João Victor', isAdmin: false }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /João Victor/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Fazer Logout' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível sair agora. Tente novamente.',
    );
    expect(navigationMocks.replace).not.toHaveBeenCalled();
    expect(screen.getByRole('menuitem', { name: 'Fazer Logout' })).toBeEnabled();
  });
});
