import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  requestPasswordReset,
  SafeAuthError,
  signIn,
  signUp,
  updatePassword,
} from '@web/features/auth/services/auth.service';

const supabaseMocks = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  signOut: vi.fn(),
  signUp: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock('client-only', () => ({}));

vi.mock('@web/lib/auth/supabase/client', () => ({
  createBrowserSupabaseClient: () => ({ auth: supabaseMocks }),
}));

describe('serviço de autenticação', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabaseMocks.signInWithPassword.mockResolvedValue({ error: null });
    supabaseMocks.resetPasswordForEmail.mockResolvedValue({ error: null });
    supabaseMocks.signOut.mockResolvedValue({ error: null });
    supabaseMocks.signUp.mockResolvedValue({ data: { session: null }, error: null });
    supabaseMocks.updateUser.mockResolvedValue({ error: null });
  });

  it('encaminha as credenciais para o login do Supabase', async () => {
    await signIn({ email: 'leitor@example.com', password: 'Senha@123' });

    expect(supabaseMocks.signInWithPassword).toHaveBeenCalledWith({
      email: 'leitor@example.com',
      password: 'Senha@123',
    });
  });

  it('não repassa detalhes técnicos ou enumeração do provedor no login', async () => {
    supabaseMocks.signInWithPassword.mockResolvedValueOnce({
      error: { code: 'invalid_credentials', message: 'provider details', status: 400 },
    });

    await expect(signIn({ email: 'leitor@example.com', password: 'incorreta' })).rejects.toEqual(
      new SafeAuthError('E-mail ou senha inválidos.'),
    );
  });

  it('envia nome público e URL de confirmação no cadastro', async () => {
    await expect(
      signUp(
        {
          displayName: 'João Victor',
          email: 'joao@example.com',
          password: 'Senha@123',
        },
        'https://vavitoarchives.com.br/auth/confirm',
      ),
    ).resolves.toEqual({ status: 'confirmation-required' });

    expect(supabaseMocks.signUp).toHaveBeenCalledWith({
      email: 'joao@example.com',
      options: {
        data: { display_name: 'João Victor' },
        emailRedirectTo: 'https://vavitoarchives.com.br/auth/confirm',
      },
      password: 'Senha@123',
    });
  });

  it('mantém sucesso indistinguível quando o cadastro exige confirmação', async () => {
    supabaseMocks.signUp.mockResolvedValueOnce({
      data: { session: null, user: { identities: [] } },
      error: null,
    });

    await expect(
      signUp(
        {
          displayName: 'João Victor',
          email: 'existente@example.com',
          password: 'Senha@123',
        },
        'https://vavitoarchives.com.br/auth/confirm',
      ),
    ).resolves.toEqual({ status: 'confirmation-required' });
  });

  it('substitui detalhes do provedor por uma falha segura no cadastro', async () => {
    supabaseMocks.signUp.mockResolvedValueOnce({
      data: { session: null },
      error: { code: 'user_already_exists', message: 'User already registered', status: 422 },
    });

    await expect(
      signUp(
        {
          displayName: 'João Victor',
          email: 'existente@example.com',
          password: 'Senha@123',
        },
        'https://vavitoarchives.com.br/auth/callback',
      ),
    ).rejects.toEqual(
      new SafeAuthError('Não foi possível criar sua conta agora. Tente novamente em instantes.'),
    );
  });

  it('solicita a recuperação com a URL de retorno informada', async () => {
    await requestPasswordReset(
      'leitor@example.com',
      'https://vavitoarchives.com.br/auth/callback?next=/auth/reset-password',
    );

    expect(supabaseMocks.resetPasswordForEmail).toHaveBeenCalledWith('leitor@example.com', {
      redirectTo: 'https://vavitoarchives.com.br/auth/callback?next=/auth/reset-password',
    });
  });

  it('não revela quando o e-mail da recuperação não possui conta', async () => {
    supabaseMocks.resetPasswordForEmail.mockResolvedValueOnce({
      error: { code: 'user_not_found', message: 'User not found', status: 400 },
    });

    await expect(
      requestPasswordReset(
        'desconhecido@example.com',
        'https://vavitoarchives.com.br/auth/callback',
      ),
    ).resolves.toBeUndefined();
  });

  it('altera a senha e encerra a sessão local de recuperação', async () => {
    await updatePassword('Nova@Senha123');

    expect(supabaseMocks.updateUser).toHaveBeenCalledWith({ password: 'Nova@Senha123' });
    expect(supabaseMocks.signOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it('converte uma sessão expirada em feedback seguro', async () => {
    supabaseMocks.updateUser.mockResolvedValueOnce({
      error: { code: 'session_not_found', message: 'provider details', status: 401 },
    });

    await expect(updatePassword('Nova@Senha123')).rejects.toEqual(
      new SafeAuthError('Este acesso expirou. Solicite um novo link para continuar.'),
    );
    expect(supabaseMocks.signOut).not.toHaveBeenCalled();
  });
});
