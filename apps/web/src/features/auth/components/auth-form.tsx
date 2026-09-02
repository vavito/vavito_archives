'use client';

import { Button, cn, Input } from '@vavito/ui';
import { CheckCircle2, Mail, UserRound } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLayoutEffect, useRef, useState, type FormEvent } from 'react';

import { LoadingSpinner } from '@web/components/feedback/loading-spinner';

import {
  AUTH_LIMITS,
  PASSWORD_REQUIREMENTS,
  toSignInCredentials,
  toSignUpCredentials,
  validateAuthCredentials,
} from '../schemas/auth-credentials.schema';
import { SafeAuthError, signIn, signUp } from '../services/auth.service';
import type { AuthField, AuthFieldErrors, AuthMode } from '../types/auth.types';
import { PasswordField } from './password-field';

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
  const fieldsContentRef = useRef<HTMLDivElement>(null);
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [fieldsHeight, setFieldsHeight] = useState<number | null>(null);
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

  useLayoutEffect(() => {
    const content = fieldsContentRef.current;
    if (!content) {
      return;
    }

    const updateHeight = () => setFieldsHeight(content.scrollHeight);
    updateHeight();

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(updateHeight);
    observer.observe(content);
    return () => observer.disconnect();
  }, [mode]);

  return (
    <section
      aria-labelledby="auth-title"
      className="auth-panel-enter auth-panel-surface bg-surface-card grid w-full max-w-md gap-7 rounded-3xl border border-border p-5 sm:p-8"
    >
      <header key={mode} className="auth-sequence grid gap-2 text-center">
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
        className="bg-surface-raised relative grid grid-cols-2 rounded-xl p-1"
        role="group"
      >
        <span
          aria-hidden="true"
          className={cn(
            'auth-mode-indicator bg-floating pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-lg shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
            isSignUp && 'translate-x-full',
          )}
          data-testid="auth-mode-indicator"
        />
        <button
          aria-label="Selecionar entrada"
          aria-pressed={!isSignUp}
          className={cn(
            'relative z-10 min-h-10 rounded-lg text-sm transition-[color,transform] duration-300 active:scale-[0.98] motion-reduce:transform-none',
            !isSignUp ? 'font-medium text-neutral-100' : 'text-neutral-400 hover:text-neutral-100',
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
            'relative z-10 min-h-10 rounded-lg text-sm transition-[color,transform] duration-300 active:scale-[0.98] motion-reduce:transform-none',
            isSignUp ? 'font-medium text-neutral-100' : 'text-neutral-400 hover:text-neutral-100',
          )}
          disabled={isSubmitting}
          onClick={() => changeMode('sign-up')}
          type="button"
        >
          Criar conta
        </button>
      </div>

      <form
        aria-busy={isSubmitting}
        className="auth-sequence grid gap-5"
        noValidate
        onSubmit={(event) => void handleSubmit(event)}
      >
        <div
          className="auth-mode-fields overflow-hidden transition-[height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
          data-testid="auth-mode-fields"
          style={fieldsHeight === null ? undefined : { height: fieldsHeight }}
        >
          <div
            key={mode}
            ref={fieldsContentRef}
            className={cn(
              'auth-sequence grid gap-5',
              isSignUp ? 'auth-mode-enter-forward' : 'auth-mode-enter-backward',
            )}
          >
            {isSignUp ? (
              <div className="group relative">
                <UserRound
                  aria-hidden="true"
                  className="text-neutral-500 absolute top-10 left-4 z-10 size-4 transition-[color,transform] duration-200 group-focus-within:scale-110 group-focus-within:text-accent motion-reduce:transform-none"
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

            <div className="group relative">
              <Mail
                aria-hidden="true"
                className="text-neutral-500 absolute top-10 left-4 z-10 size-4 transition-[color,transform] duration-200 group-focus-within:scale-110 group-focus-within:text-accent motion-reduce:transform-none"
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

            <PasswordField
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              description={isSignUp ? PASSWORD_REQUIREMENTS : undefined}
              disabled={isSubmitting}
              error={errors.password}
              label="Senha"
              maxLength={AUTH_LIMITS.password.max}
              name="password"
              onChange={() => clearFieldError('password')}
              placeholder={isSignUp ? 'Crie uma senha segura' : 'Sua senha'}
              required
            />

            {!isSignUp ? (
              <Link
                className="text-accent -mt-2 justify-self-end text-sm font-medium transition-[color,opacity,transform] duration-200 hover:-translate-y-0.5 hover:underline hover:opacity-80 motion-reduce:transform-none"
                href="/auth/forgot-password"
              >
                Esqueci minha senha
              </Link>
            ) : null}

            {isSignUp ? (
              <PasswordField
                autoComplete="new-password"
                disabled={isSubmitting}
                error={errors.passwordConfirmation}
                label="Confirme a senha"
                maxLength={AUTH_LIMITS.password.max}
                name="passwordConfirmation"
                onChange={() => clearFieldError('passwordConfirmation')}
                placeholder="Digite a senha novamente"
                required
              />
            ) : null}
          </div>
        </div>

        <Button className="w-full" disabled={isSubmitting} size="large" type="submit">
          {isSubmitting ? <LoadingSpinner /> : null}
          <span
            key={isSubmitting ? 'submitting' : mode}
            className="auth-icon-swap"
            aria-live="polite"
          >
            {isSubmitting ? 'Aguarde…' : isSignUp ? 'Criar conta' : 'Entrar'}
          </span>
        </Button>
      </form>

      {state.status === 'success' ? (
        <p
          aria-live="polite"
          className="auth-feedback-enter text-accent flex items-start gap-2 text-sm leading-relaxed"
          role="status"
        >
          <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {state.message}
        </p>
      ) : null}
      {state.status === 'error' ? (
        <p
          aria-live="assertive"
          className="auth-feedback-enter text-destructive text-sm leading-relaxed"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}
    </section>
  );
}
