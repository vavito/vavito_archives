'use client';

import { Button, cn, Input } from '@vavito/ui';
import { CheckCircle2, LockKeyhole, Mail, UserRound } from 'lucide-react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import {
  AUTH_LIMITS,
  PASSWORD_REQUIREMENTS,
  toSignInCredentials,
  toSignUpCredentials,
  validateAuthCredentials,
} from '../schemas/auth-credentials.schema';
import { SafeAuthError, signIn, signUp } from '../services/auth.service';
import type { AuthField, AuthFieldErrors, AuthMode } from '../types/auth.types';

interface AuthFeedback {
  message: string;
  tone: 'error' | 'success';
}

interface AuthFormProps {
  initialFeedback?: AuthFeedback;
  initialMode?: AuthMode;
  nextPath?: string;
}

type SubmissionState =
  { status: 'idle' } | { message: string; status: 'error' | 'success' } | { status: 'submitting' };

const AUTH_FIELDS: Record<AuthMode, readonly AuthField[]> = {
  'sign-in': ['email', 'password'],
  'sign-up': ['displayName', 'email', 'password', 'passwordConfirmation'],
};

const SIGN_UP_SUCCESS_MESSAGE =
  'Confira seu e-mail para confirmar o cadastro. Se ele já estiver associado a uma conta, nenhuma nova conta será criada.';

function focusFirstInvalidField(
  form: HTMLFormElement,
  mode: AuthMode,
  errors: AuthFieldErrors,
): void {
  const field = AUTH_FIELDS[mode].find((name) => errors[name]);
  const control = field ? form.elements.namedItem(field) : null;

  if (control instanceof HTMLElement) {
    control.focus();
  }
}

export function AuthForm({
  initialFeedback,
  initialMode = 'sign-in',
  nextPath = '/',
}: Readonly<AuthFormProps>) {
  const router = useRouter();
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [state, setState] = useState<SubmissionState>(
    initialFeedback
      ? { message: initialFeedback.message, status: initialFeedback.tone }
      : { status: 'idle' },
  );

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setErrors({});
    setState({ status: 'idle' });
  }

  function clearFieldError(field: AuthField) {
    setErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[field];
      return nextErrors;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const result = validateAuthCredentials(new FormData(form), mode);

    if (Object.keys(result.errors).length > 0) {
      setErrors(result.errors);
      setState({ status: 'idle' });
      focusFirstInvalidField(form, mode, result.errors);
      return;
    }

    setErrors({});
    setState({ status: 'submitting' });

    try {
      if (mode === 'sign-in') {
        await signIn(toSignInCredentials(result));
        router.replace(nextPath as Route);
        router.refresh();
        return;
      }

      const confirmationUrl = new URL('/auth/callback', window.location.origin);
      confirmationUrl.searchParams.set('next', '/auth?auth_status=confirmed');
      const response = await signUp(toSignUpCredentials(result), confirmationUrl.toString());

      if (response.status === 'authenticated') {
        router.replace(nextPath as Route);
        router.refresh();
        return;
      }

      form.reset();
      setState({ message: SIGN_UP_SUCCESS_MESSAGE, status: 'success' });
    } catch (error) {
      setState({
        message:
          error instanceof SafeAuthError
            ? error.message
            : 'Não foi possível concluir esta ação agora. Tente novamente.',
        status: 'error',
      });
    }
  }

  const isSubmitting = state.status === 'submitting';
  const isSignUp = mode === 'sign-up';

  return (
    <section
      aria-labelledby="auth-title"
      className="bg-surface-card grid w-full max-w-md gap-7 rounded-3xl border border-border p-5 sm:p-8"
    >
      <header className="grid gap-2 text-center">
        <p className="text-accent text-xs font-medium tracking-eyebrow uppercase">Sua conta</p>
        <h1 className="text-2xl font-semibold text-neutral-100" id="auth-title">
          {isSignUp ? 'Crie sua conta' : 'Que bom ter você aqui'}
        </h1>
        <p className="text-neutral-400 text-sm leading-relaxed">
          {isSignUp
            ? 'Cadastre-se para comentar, reagir e guardar seus artigos favoritos.'
            : 'Entre para continuar participando do Vavito Archives.'}
        </p>
      </header>

      <div
        aria-label="Escolher fluxo de autenticação"
        className="bg-surface-raised grid grid-cols-2 rounded-xl p-1"
        role="group"
      >
        <button
          aria-label="Selecionar entrada"
          aria-pressed={!isSignUp}
          className={cn(
            'min-h-10 rounded-lg text-sm transition-colors',
            !isSignUp
              ? 'bg-floating font-medium text-neutral-100 shadow-sm'
              : 'text-neutral-400 hover:text-neutral-100',
          )}
          disabled={isSubmitting}
          onClick={() => changeMode('sign-in')}
          type="button"
        >
          Entrar
        </button>
        <button
          aria-label="Selecionar criação de conta"
          aria-pressed={isSignUp}
          className={cn(
            'min-h-10 rounded-lg text-sm transition-colors',
            isSignUp
              ? 'bg-floating font-medium text-neutral-100 shadow-sm'
              : 'text-neutral-400 hover:text-neutral-100',
          )}
          disabled={isSubmitting}
          onClick={() => changeMode('sign-up')}
          type="button"
        >
          Criar conta
        </button>
      </div>

      <form className="grid gap-5" noValidate onSubmit={(event) => void handleSubmit(event)}>
        {isSignUp ? (
          <div className="relative">
            <UserRound
              aria-hidden="true"
              className="text-neutral-500 absolute top-10 left-4 z-10 size-4"
            />
            <Input
              autoComplete="name"
              className="pl-11"
              disabled={isSubmitting}
              error={errors.displayName}
              label="Nome"
              maxLength={AUTH_LIMITS.displayName.max}
              name="displayName"
              onChange={() => clearFieldError('displayName')}
              placeholder="Como podemos chamar você?"
              required
            />
          </div>
        ) : null}

        <div className="relative">
          <Mail
            aria-hidden="true"
            className="text-neutral-500 absolute top-10 left-4 z-10 size-4"
          />
          <Input
            autoComplete="email"
            className="pl-11"
            disabled={isSubmitting}
            error={errors.email}
            label="E-mail"
            maxLength={AUTH_LIMITS.email}
            name="email"
            onChange={() => clearFieldError('email')}
            placeholder="voce@exemplo.com"
            required
            type="email"
          />
        </div>

        <div className="relative">
          <LockKeyhole
            aria-hidden="true"
            className="text-neutral-500 absolute top-10 left-4 z-10 size-4"
          />
          <Input
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            className="pl-11"
            description={isSignUp ? PASSWORD_REQUIREMENTS : undefined}
            disabled={isSubmitting}
            error={errors.password}
            label="Senha"
            maxLength={AUTH_LIMITS.password.max}
            name="password"
            onChange={() => clearFieldError('password')}
            placeholder={isSignUp ? 'Crie uma senha segura' : 'Sua senha'}
            required
            type="password"
          />
        </div>

        {isSignUp ? (
          <div className="relative">
            <LockKeyhole
              aria-hidden="true"
              className="text-neutral-500 absolute top-10 left-4 z-10 size-4"
            />
            <Input
              autoComplete="new-password"
              className="pl-11"
              disabled={isSubmitting}
              error={errors.passwordConfirmation}
              label="Confirme a senha"
              maxLength={AUTH_LIMITS.password.max}
              name="passwordConfirmation"
              onChange={() => clearFieldError('passwordConfirmation')}
              placeholder="Digite a senha novamente"
              required
              type="password"
            />
          </div>
        ) : null}

        <Button className="w-full" disabled={isSubmitting} size="large" type="submit">
          {isSubmitting ? 'Aguarde…' : isSignUp ? 'Criar conta' : 'Entrar'}
        </Button>
      </form>

      {state.status === 'success' ? (
        <p
          aria-live="polite"
          className="text-accent flex items-start gap-2 text-sm leading-relaxed"
          role="status"
        >
          <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {state.message}
        </p>
      ) : null}
      {state.status === 'error' ? (
        <p aria-live="assertive" className="text-destructive text-sm leading-relaxed" role="alert">
          {state.message}
        </p>
      ) : null}
    </section>
  );
}
