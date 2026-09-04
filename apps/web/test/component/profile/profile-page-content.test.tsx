import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ProfilePageContent } from '@web/features/profile/components/profile-page-content';

const profileMocks = vi.hoisted(() => ({
  clearDeletedAccountSession: vi.fn(),
  deleteProfileAccount: vi.fn(),
  removeProfileAvatar: vi.fn(),
  updateProfileName: vi.fn(),
  uploadProfileAvatar: vi.fn(),
  signOutSession: vi.fn(),
}));

const routerMocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  replace: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => routerMocks,
}));

vi.mock('@web/features/auth', () => ({ signOutSession: profileMocks.signOutSession }));

vi.mock('@web/features/profile/services/profile.service', () => ({
  SafeProfileActionError: class SafeProfileActionError extends Error {},
  DELETE_ACCOUNT_CONFIRMATION: 'EXCLUIR MINHA CONTA',
  clearDeletedAccountSession: profileMocks.clearDeletedAccountSession,
  deleteProfileAccount: profileMocks.deleteProfileAccount,
  removeProfileAvatar: profileMocks.removeProfileAvatar,
  updateProfileName: profileMocks.updateProfileName,
  uploadProfileAvatar: profileMocks.uploadProfileAvatar,
}));

const initialProfile = {
  avatarUrl: null,
  createdAt: '2026-08-12T20:15:00.000Z',
  displayName: 'João Victor',
  id: '019c2d62-6e90-7000-8000-000000000001',
  role: 'USER' as const,
  updatedAt: '2026-09-02T12:00:00.000Z',
};

describe('conteúdo da página de perfil', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    profileMocks.clearDeletedAccountSession.mockResolvedValue(undefined);
    profileMocks.signOutSession.mockResolvedValue(undefined);
    profileMocks.deleteProfileAccount.mockResolvedValue(undefined);
    profileMocks.removeProfileAvatar.mockResolvedValue(undefined);
    profileMocks.updateProfileName.mockResolvedValue(initialProfile);
    profileMocks.uploadProfileAvatar.mockResolvedValue({
      ...initialProfile,
      avatarUrl: 'https://cdn.example.com/avatar.webp',
    });
  });

  it('exibe os dados da conta e o acesso à alteração de senha', () => {
    render(<ProfilePageContent email="leitor@example.com" initialProfile={initialProfile} />);

    expect(screen.getByDisplayValue('João Victor')).toBeInTheDocument();
    expect(screen.getByText('leitor@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fazer Logout' })).toHaveClass('sm:hidden');
    expect(screen.getByRole('link', { name: 'Alterar senha' })).toHaveAttribute(
      'href',
      '/auth/forgot-password',
    );
  });

  it('oferece logout no perfil com loading e retorna à página inicial', async () => {
    let finish!: () => void;
    profileMocks.signOutSession.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    render(<ProfilePageContent email="leitor@example.com" initialProfile={initialProfile} />);
    fireEvent.click(screen.getByRole('button', { name: 'Fazer Logout' }));
    expect(screen.getByRole('button', { name: 'Saindo…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Salvar nome' })).toBeDisabled();
    finish();
    await waitFor(() => expect(routerMocks.replace).toHaveBeenCalledWith('/'));
    expect(routerMocks.refresh).toHaveBeenCalled();
  });

  it('mantém a página e permite repetir o logout quando há falha', async () => {
    profileMocks.signOutSession.mockRejectedValueOnce(new Error('private technical details'));
    render(<ProfilePageContent email="leitor@example.com" initialProfile={initialProfile} />);
    fireEvent.click(screen.getByRole('button', { name: 'Fazer Logout' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível sair agora. Tente novamente.',
    );
    expect(routerMocks.replace).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Fazer Logout' })).toBeEnabled();
  });

  it('valida e normaliza o nome antes de atualizar o perfil', async () => {
    render(<ProfilePageContent email="leitor@example.com" initialProfile={initialProfile} />);
    const name = screen.getByLabelText('Nome');

    fireEvent.change(name, { target: { value: ' J ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar nome' }));

    expect(screen.getByText('Informe seu nome com pelo menos 2 caracteres.')).toBeInTheDocument();
    expect(profileMocks.updateProfileName).not.toHaveBeenCalled();

    fireEvent.change(name, { target: { value: '  Maria   Silva  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar nome' }));

    await waitFor(() => {
      expect(profileMocks.updateProfileName).toHaveBeenCalledWith('Maria Silva');
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Seu nome foi atualizado.');
    expect(routerMocks.refresh).toHaveBeenCalled();
  });

  it('rejeita um formato inválido antes do upload do avatar', () => {
    render(<ProfilePageContent email="leitor@example.com" initialProfile={initialProfile} />);
    const file = new File(['avatar'], 'avatar.gif', { type: 'image/gif' });

    fireEvent.change(screen.getByLabelText('Escolher nova foto do perfil'), {
      target: { files: [file] },
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Escolha uma imagem JPG, PNG ou WebP.');
    expect(profileMocks.uploadProfileAvatar).not.toHaveBeenCalled();
  });

  it('envia o avatar válido e atualiza a imagem exibida', async () => {
    render(<ProfilePageContent email="leitor@example.com" initialProfile={initialProfile} />);
    const file = new File(['avatar'], 'avatar.webp', { type: 'image/webp' });

    fireEvent.change(screen.getByLabelText('Escolher nova foto do perfil'), {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(profileMocks.uploadProfileAvatar).toHaveBeenCalledWith(file);
    });
    expect(await screen.findByAltText('Foto de João Victor')).toBeInTheDocument();
  });

  it('mantém o erro da ação visível em um card flutuante sem exigir rolagem', async () => {
    profileMocks.updateProfileName.mockRejectedValueOnce(
      new Error('falha interna que não deve aparecer'),
    );
    render(<ProfilePageContent email="leitor@example.com" initialProfile={initialProfile} />);

    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Maria Silva' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar nome' }));

    const feedback = await screen.findByRole('alert');
    expect(feedback).toHaveTextContent('Não foi possível atualizar seu nome agora.');
    expect(feedback.parentElement).toHaveClass('fixed', 'left-1/2');
  });

  it('só permite excluir a conta após a confirmação exata', async () => {
    render(<ProfilePageContent email="leitor@example.com" initialProfile={initialProfile} />);

    fireEvent.click(screen.getByRole('button', { name: 'Excluir conta' }));
    const deleteButton = await screen.findByRole('button', { name: 'Excluir definitivamente' });
    expect(deleteButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Confirmação'), {
      target: { value: 'EXCLUIR MINHA CONTA' },
    });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(profileMocks.deleteProfileAccount).toHaveBeenCalled();
      expect(profileMocks.clearDeletedAccountSession).toHaveBeenCalled();
    });
    expect(routerMocks.replace).toHaveBeenCalledWith('/');
    expect(routerMocks.refresh).toHaveBeenCalled();
  });
});
