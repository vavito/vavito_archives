import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthForm } from '@web/features/auth/components/auth-form';
import { SafeAuthError } from '@web/features/auth/services/auth.service';

const authMocks = vi.hoisted(() => ({
  resendSignUpConfirmation: vi.fn(),
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

const routerMocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  replace: vi.fn(),
}));

vi.mock('@web/features/auth/services/auth.service', () => ({
  SafeAuthError: class SafeAuthError extends Error {},
  resendSignUpConfirmation: authMocks.resendSignUpConfirmation,
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
    vi.clearAllMocks();
    authMocks.resendSignUpConfirmation.mockResolvedValue(undefined);
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

  it('permite mostrar e ocultar a senha sem apagar seu conteúdo', () => {
    render(<AuthForm />);
    const password = screen.getByLabelText('Senha');
    fireEvent.change(password, { target: { value: 'Senha@123' } });

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar conteúdo do campo Senha' }));

    expect(password).toHaveAttribute('type', 'text');
    expect(password).toHaveValue('Senha@123');

    fireEvent.click(screen.getByRole('button', { name: 'Ocultar conteúdo do campo Senha' }));

    expect(password).toHaveAttribute('type', 'password');
    expect(password).toHaveValue('Senha@123');
  });

  it('apresenta o spinner padronizado enquanto a entrada está em andamento', () => {
    authMocks.signIn.mockReturnValueOnce(new Promise(() => undefined));
    render(<AuthForm />);
    fillSignIn();

    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    const submittingButton = screen.getByRole('button', { name: 'Aguarde…' });
    expect(submittingButton).toBeDisabled();
    expect(submittingButton.querySelector('svg')).toHaveClass('counterclockwise-spinner');
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

  it('mostra e oculta as duas senhas do cadastro em conjunto', () => {
    render(<AuthForm />);
    fireEvent.click(screen.getByRole('button', { name: 'Selecionar criação de conta' }));
    const password = screen.getByLabelText('Senha');
    const confirmation = screen.getByLabelText('Confirme a senha');
    const visibilityButtons = screen.getAllByRole('button', {
      name: 'Mostrar as senhas do cadastro',
    });

    fireEvent.click(visibilityButtons[0]!);

    expect(password).toHaveAttribute('type', 'text');
    expect(confirmation).toHaveAttribute('type', 'text');
    expect(screen.getAllByRole('button', { name: 'Ocultar as senhas do cadastro' })).toHaveLength(
      2,
    );

    fireEvent.click(screen.getAllByRole('button', { name: 'Ocultar as senhas do cadastro' })[1]!);

    expect(password).toHaveAttribute('type', 'password');
    expect(confirmation).toHaveAttribute('type', 'password');
  });

  it('anima o indicador e o conteúdo ao alternar os modos', () => {
    render(<AuthForm />);
    const indicator = screen.getByTestId('auth-mode-indicator');
    const fields = screen.getByTestId('auth-mode-fields');

    expect(indicator).not.toHaveClass('translate-x-full');
    expect(fields.firstElementChild).toHaveClass('auth-mode-enter-backward');

    fireEvent.click(screen.getByRole('button', { name: 'Selecionar criação de conta' }));

    expect(indicator).toHaveClass('translate-x-full');
    expect(fields.firstElementChild).toHaveClass('auth-mode-enter-forward');
    expect(screen.getByRole('heading', { name: 'Crie sua conta' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Selecionar entrada' }));

    expect(indicator).not.toHaveClass('translate-x-full');
    expect(fields.firstElementChild).toHaveClass('auth-mode-enter-backward');
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
        'http://localhost:3000/auth/callback?next=%2Fauth%2Fconfirmed',
      );
    });
    expect(await screen.findByRole('heading', { name: 'Cadastro realizado!' })).toBeInTheDocument();
    expect(screen.getByText(/leitor@example.com/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reenviar em 60s' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Criar conta' })).not.toBeInTheDocument();
  });
});
