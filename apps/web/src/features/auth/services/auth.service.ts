import type { AuthError } from '@supabase/supabase-js';

import { createBrowserSupabaseClient } from '@web/lib/auth/supabase/client';

import type { SignInCredentials, SignUpCredentials, SignUpResult } from '../types/auth.types';

export class SafeAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SafeAuthError';
  }
}

export async function signIn(credentials: SignInCredentials): Promise<void> {
  const supabase = createBrowserSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword(credentials);

  if (error) {
    throw new SafeAuthError(toSafeSignInMessage(error));
  }
}

export async function signUp(
  credentials: SignUpCredentials,
  emailRedirectTo: string,
): Promise<SignUpResult> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email: credentials.email,
    options: {
      data: { display_name: credentials.displayName },
      emailRedirectTo,
    },
    password: credentials.password,
  });

  if (error) {
    throw new SafeAuthError(toSafeSignUpMessage(error));
  }

  return { status: data.session ? 'authenticated' : 'confirmation-required' };
}

export async function requestPasswordReset(email: string, redirectTo: string): Promise<void> {
  const supabase = createBrowserSupabaseClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  if (!error) {
    return;
  }

  if (isRateLimitError(error)) {
    throw new SafeAuthError(
      'Muitas solicitações em pouco tempo. Aguarde alguns minutos e tente novamente.',
    );
  }

  if (error.code === 'user_not_found') {
    return;
  }

  throw new SafeAuthError('Não foi possível enviar o link agora. Tente novamente em instantes.');
}

export async function updatePassword(password: string): Promise<void> {
  const supabase = createBrowserSupabaseClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    throw new SafeAuthError(toSafePasswordUpdateMessage(error));
  }

  await supabase.auth.signOut({ scope: 'local' });
}

function isRateLimitError(error: AuthError): boolean {
  return error.status === 429 || error.code?.includes('rate_limit') === true;
}

function toSafeSignInMessage(error: AuthError): string {
  if (isRateLimitError(error)) {
    return 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.';
  }

  if (error.code === 'email_not_confirmed') {
    return 'Confirme seu e-mail antes de entrar.';
  }

  return 'E-mail ou senha inválidos.';
}

function toSafeSignUpMessage(error: AuthError): string {
  if (isRateLimitError(error)) {
    return 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.';
  }

  if (error.code === 'weak_password') {
    return 'A senha não atende aos critérios de segurança.';
  }

  return 'Não foi possível criar sua conta agora. Tente novamente em instantes.';
}

function toSafePasswordUpdateMessage(error: AuthError): string {
  if (isRateLimitError(error)) {
    return 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.';
  }

  if (error.code === 'weak_password') {
    return 'A senha não atende aos critérios de segurança.';
  }

  if (error.code === 'same_password') {
    return 'Escolha uma senha diferente da atual.';
  }

  if (
    error.code === 'session_not_found' ||
    error.code === 'refresh_token_not_found' ||
    error.code === 'otp_expired'
  ) {
    return 'Este acesso expirou. Solicite um novo link para continuar.';
  }

  return 'Não foi possível alterar sua senha agora. Solicite um novo link e tente novamente.';
}
