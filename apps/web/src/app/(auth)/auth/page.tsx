import type { Metadata } from 'next';

import { AuthForm } from '@web/features/auth';
import { getSafeRedirectPath } from '@web/lib/auth/redirect-path';

export const metadata: Metadata = {
  description: 'Entre ou crie sua conta para participar do Vavito Archives.',
  title: 'Acessar conta',
};

interface AuthPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const AUTH_MESSAGES: Record<string, { message: string; tone: 'error' | 'success' }> = {
  callback_failed: {
    message: 'Não foi possível concluir sua entrada. Tente novamente.',
    tone: 'error',
  },
  confirmation_failed: {
    message: 'Este link não pôde ser confirmado. Ele pode ter expirado ou já ter sido utilizado.',
    tone: 'error',
  },
  confirmed: {
    message: 'E-mail confirmado. Sua conta está pronta para usar.',
    tone: 'success',
  },
};

export default async function AuthPage({ searchParams }: Readonly<AuthPageProps>) {
  const parameters = await searchParams;
  const mode = singleValue(parameters.mode) === 'cadastro' ? 'sign-up' : 'sign-in';
  const nextPath = getSafeRedirectPath(singleValue(parameters.next));
  const feedback = getInitialFeedback(parameters);

  return (
    <AuthForm
      {...(feedback ? { initialFeedback: feedback } : {})}
      initialMode={mode}
      nextPath={nextPath}
    />
  );
}

function getInitialFeedback(parameters: Record<string, string | string[] | undefined>) {
  const error = singleValue(parameters.auth_error);
  const status = singleValue(parameters.auth_status);

  if (error && AUTH_MESSAGES[error]) {
    return AUTH_MESSAGES[error];
  }

  if (status && AUTH_MESSAGES[status]) {
    return AUTH_MESSAGES[status];
  }

  return undefined;
}

function singleValue(value: string | string[] | undefined): string | null {
  return typeof value === 'string' ? value : null;
}
