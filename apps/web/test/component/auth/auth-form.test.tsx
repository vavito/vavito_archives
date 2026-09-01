import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthForm } from '@web/features/auth/components/auth-form';
import { SafeAuthError } from '@web/features/auth/services/auth.service';

const authMocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

const routerMocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  replace: vi.fn(),
}));

vi.mock('@web/features/auth/services/auth.service', () => ({
  SafeAuthError: class SafeAuthError extends Error {},
  signIn: authMocks.signIn,
  signUp: authMocks.signUp,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => routerMocks,
}));

function fillSignIn() {
  fireEvent.change(screen.getByLabelText('E-mail'), {
    target: { value: ' LEITOR@EXAMPLE.COM ' },
  });
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'Senha@123' } });
}

function fillSignUp() {
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: ' João Victor ' } });
  fillSignIn();
  fireEvent.change(screen.getByLabelText('Confirme a senha'), {
    target: { value: 'Senha@123' },
  });
}

describe('AuthForm', () => {
  beforeEach(() => {
    authMocks.signIn.mockResolvedValue(undefined);
    authMocks.signUp.mockResolvedValue({ status: 'confirmation-required' });
  });

  it('valida os campos de entrada antes de consultar o Supabase', () => {
    render(<AuthForm />);

    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(screen.getByText('Informe um endereço de e-mail válido.')).toBeInTheDocument();
    expect(screen.getByText('Informe sua senha.')).toBeInTheDocument();
    expect(authMocks.signIn).not.toHaveBeenCalled();
    expect(screen.getByLabelText('E-mail')).toHaveFocus();
  });

  it('entra com credenciais normalizadas e respeita o destino interno', async () => {
    render(<AuthForm nextPath="/artigos/post-seguro" />);
    fillSignIn();

    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(authMocks.signIn).toHaveBeenCalledWith({
        email: 'leitor@example.com',
        password: 'Senha@123',
      });
    });
    expect(routerMocks.replace).toHaveBeenCalledWith('/artigos/post-seguro');
    expect(routerMocks.refresh).toHaveBeenCalled();
  });

  it('apresenta somente a mensagem segura de falha no login', async () => {
    authMocks.signIn.mockRejectedValueOnce(new SafeAuthError('E-mail ou senha inválidos.'));
    render(<AuthForm />);
    fillSignIn();

    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha inválidos.');
  });

  it('aplica a política de senha ao criar uma conta', () => {
    render(<AuthForm />);
    fireEvent.click(screen.getByRole('button', { name: 'Selecionar criação de conta' }));
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'João' } });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'joao@example.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'simples' } });
    fireEvent.change(screen.getByLabelText('Confirme a senha'), { target: { value: 'diferente' } });

    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(screen.getByText('A senha ainda não atende a todos os critérios.')).toBeInTheDocument();
    expect(screen.getByText('As senhas precisam ser iguais.')).toBeInTheDocument();
    expect(authMocks.signUp).not.toHaveBeenCalled();
  });

  it('solicita o cadastro com nome público e feedback sem enumeração', async () => {
    render(<AuthForm />);
    fireEvent.click(screen.getByRole('button', { name: 'Selecionar criação de conta' }));
    fillSignUp();

    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

    await waitFor(() => {
      expect(authMocks.signUp).toHaveBeenCalledWith(
        {
          displayName: 'João Victor',
          email: 'leitor@example.com',
          password: 'Senha@123',
        },
        'http://localhost:3000/auth/callback?next=%2Fauth%3Fauth_status%3Dconfirmed',
      );
    });
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Confira seu e-mail para confirmar o cadastro.',
    );
  });
});
