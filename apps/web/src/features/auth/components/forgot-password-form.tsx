'use client';

import { Button, Input } from '@vavito/ui';
import { CheckCircle2, Mail } from 'lucide-react';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';

import { LoadingSpinner } from '@web/components/feedback/loading-spinner';

import { AUTH_LIMITS } from '../schemas/auth-credentials.schema';
import { validateRecoveryEmail } from '../schemas/password-recovery.schema';
import { requestPasswordReset, SafeAuthError } from '../services/auth.service';

type SubmissionState =
  { status: 'idle' } | { message: string; status: 'error' | 'success' } | { status: 'submitting' };

const RECOVERY_SUCCESS_MESSAGE =
  'Se existir uma conta para este e-mail, enviaremos um link para você criar uma nova senha.';

export function ForgotPasswordForm() {
  const [emailError, setEmailError] = useState<string>();
  const [state, setState] = useState<SubmissionState>({ status: 'idle' });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const result = validateRecoveryEmail(new FormData(form));

    if (result.errors.email) {
      setEmailError(result.errors.email);
      setState({ status: 'idle' });
      const control = form.elements.namedItem('email');
      if (control instanceof HTMLElement) {
        control.focus();
      }
      return;
    }

    setEmailError(undefined);
    setState({ status: 'submitting' });

    try {
      const callbackUrl = new URL('/auth/callback', window.location.origin);
      callbackUrl.searchParams.set('next', '/auth/reset-password');
      await requestPasswordReset(result.email, callbackUrl.toString());
      form.reset();
      setState({ message: RECOVERY_SUCCESS_MESSAGE, status: 'success' });
    } catch (error) {
      setState({
        message:
          error instanceof SafeAuthError
            ? error.message
            : 'Não foi possível enviar o link agora. Tente novamente.',
        status: 'error',
      });
    }
  }

  const isSubmitting = state.status === 'submitting';

  return (
    <section
      aria-labelledby="forgot-password-title"
      className="auth-panel-enter auth-panel-surface bg-surface-card grid w-full max-w-md gap-7 rounded-3xl border border-border p-5 sm:p-8"
    >
      <header className="auth-sequence grid gap-2 text-center">
        <p className="text-accent text-xs font-medium tracking-eyebrow uppercase">
          Recuperar acesso
        </p>
        <h1 className="text-2xl font-semibold text-neutral-100" id="forgot-password-title">
          Esqueceu sua senha?
        </h1>
        <p className="text-neutral-400 text-sm leading-relaxed">
          Informe seu e-mail para receber um link seguro e criar uma nova senha.
        </p>
      </header>

      <form
        aria-busy={isSubmitting}
        className="auth-sequence grid gap-5"
        noValidate
        onSubmit={(event) => void handleSubmit(event)}
      >
        <div className="group relative">
          <Mail
            aria-hidden="true"
            className="text-neutral-500 absolute top-10 left-4 z-10 size-4 transition-[color,transform] duration-200 group-focus-within:scale-110 group-focus-within:text-accent motion-reduce:transform-none"
          />
          <Input
            autoComplete="email"
            className="pl-11"
            disabled={isSubmitting}
            error={emailError}
            label="E-mail"
            maxLength={AUTH_LIMITS.email}
            name="email"
            onChange={() => setEmailError(undefined)}
            placeholder="voce@exemplo.com"
            required
            type="email"
          />
        </div>

        <Button className="w-full" disabled={isSubmitting} size="large" type="submit">
          {isSubmitting ? <LoadingSpinner /> : null}
          <span
            key={isSubmitting ? 'submitting' : 'idle'}
            className="auth-icon-swap"
            aria-live="polite"
          >
            {isSubmitting ? 'Enviando…' : 'Enviar link'}
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

      <Link
        className="auth-feedback-enter text-accent justify-self-center text-sm font-medium transition-[color,opacity,transform] duration-200 hover:-translate-y-0.5 hover:underline hover:opacity-80 motion-reduce:transform-none"
        href="/auth"
      >
        Voltar para entrar
      </Link>
    </section>
  );
}
