import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ForgotPasswordForm } from '@web/features/auth/components/forgot-password-form';
import { ResetPasswordForm } from '@web/features/auth/components/reset-password-form';
import {
  PasswordSessionsSignOutError,
  SafeAuthError,
} from '@web/features/auth/services/auth.service';
import type * as AuthService from '@web/features/auth/services/auth.service';

const authMocks = vi.hoisted(() => ({
  requestPasswordReset: vi.fn(),
  updatePassword: vi.fn(),
  finishPasswordSessionSignOut: vi.fn(),
}));

const routerMocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  replace: vi.fn(),
}));

vi.mock('@web/features/auth/services/auth.service', async (importOriginal) => ({
  ...(await importOriginal<typeof AuthService>()),
  requestPasswordReset: authMocks.requestPasswordReset,
  updatePassword: authMocks.updatePassword,
  finishPasswordSessionSignOut: authMocks.finishPasswordSessionSignOut,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => routerMocks,
}));

describe('formulários de recuperação de senha', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.requestPasswordReset.mockResolvedValue(undefined);
    authMocks.updatePassword.mockResolvedValue(undefined);
    authMocks.finishPasswordSessionSignOut.mockResolvedValue(undefined);
  });

  it('valida o e-mail antes de solicitar o link', () => {
    render(<ForgotPasswordForm />);

    fireEvent.click(screen.getByRole('button', { name: 'Enviar link' }));

    expect(screen.getByText('Informe um endereço de e-mail válido.')).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toHaveFocus();
    expect(authMocks.requestPasswordReset).not.toHaveBeenCalled();
  });

  it('solicita o link e apresenta feedback sem confirmar a existência da conta', async () => {
    render(<ForgotPasswordForm />);
    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: ' LEITOR@EXAMPLE.COM ' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Enviar link' }));

    await waitFor(() => {
      expect(authMocks.requestPasswordReset).toHaveBeenCalledWith(
        'leitor@example.com',
        'http://localhost:3000/auth/callback?next=%2Fauth%2Freset-password',
      );
    });
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Se existir uma conta para este e-mail, enviaremos um link',
    );
  });

  it('valida a política e a confirmação da nova senha', () => {
    render(<ResetPasswordForm />);
    fireEvent.change(screen.getByLabelText('Nova senha'), { target: { value: 'simples' } });
    fireEvent.change(screen.getByLabelText('Confirme a nova senha'), {
      target: { value: 'diferente' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Alterar senha' }));

    expect(screen.getByText('A senha ainda não atende a todos os critérios.')).toBeInTheDocument();
    expect(screen.getByText('As senhas precisam ser iguais.')).toBeInTheDocument();
    expect(screen.getByLabelText('Nova senha')).toHaveFocus();
    expect(authMocks.updatePassword).not.toHaveBeenCalled();
  });

  it('altera a senha e direciona para uma nova entrada', async () => {
    render(<ResetPasswordForm />);
    fireEvent.change(screen.getByLabelText('Nova senha'), { target: { value: 'Nova@Senha123' } });
    fireEvent.change(screen.getByLabelText('Confirme a nova senha'), {
      target: { value: 'Nova@Senha123' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Alterar senha' }));

    await waitFor(() => {
      expect(authMocks.updatePassword).toHaveBeenCalledWith('Nova@Senha123');
    });
    expect(routerMocks.replace).toHaveBeenCalledWith('/auth?auth_status=password_updated');
    expect(routerMocks.refresh).toHaveBeenCalled();
  });

  it('apresenta uma mensagem segura quando o acesso de recuperação expirou', async () => {
    authMocks.updatePassword.mockRejectedValueOnce(
      new SafeAuthError('Este acesso expirou. Solicite um novo link para continuar.'),
    );
    render(<ResetPasswordForm />);
    fireEvent.change(screen.getByLabelText('Nova senha'), { target: { value: 'Nova@Senha123' } });
    fireEvent.change(screen.getByLabelText('Confirme a nova senha'), {
      target: { value: 'Nova@Senha123' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Alterar senha' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Este acesso expirou.');
  });

  it('repete somente o logout global após sucesso parcial sem reaplicar a senha', async () => {
    authMocks.updatePassword.mockRejectedValueOnce(new PasswordSessionsSignOutError());
    render(<ResetPasswordForm />);
    fireEvent.change(screen.getByLabelText('Nova senha'), { target: { value: 'Nova@Senha123' } });
    fireEvent.change(screen.getByLabelText('Confirme a nova senha'), {
      target: { value: 'Nova@Senha123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Alterar senha' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Sua senha foi alterada');
    expect(routerMocks.replace).not.toHaveBeenCalled();
    expect(screen.queryByLabelText('Nova senha')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Encerrar sessões' }));
    await waitFor(() =>
      expect(routerMocks.replace).toHaveBeenCalledWith('/auth?auth_status=password_updated'),
    );
    expect(authMocks.updatePassword).toHaveBeenCalledTimes(1);
    expect(authMocks.finishPasswordSessionSignOut).toHaveBeenCalledTimes(1);
  });
});
