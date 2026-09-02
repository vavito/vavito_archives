'use client';

import { Button } from '@vavito/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { LoadingSpinner } from '@web/components/feedback/loading-spinner';

import { AUTH_LIMITS, PASSWORD_REQUIREMENTS } from '../schemas/auth-credentials.schema';
import { validateNewPassword } from '../schemas/password-recovery.schema';
import { SafeAuthError, updatePassword } from '../services/auth.service';
import type { PasswordRecoveryField, PasswordRecoveryFieldErrors } from '../types/auth.types';
import { PasswordField } from './password-field';

type SubmissionState =
  { status: 'idle' } | { message: string; status: 'error' } | { status: 'submitting' };

export function ResetPasswordForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<PasswordRecoveryFieldErrors>({});
  const [state, setState] = useState<SubmissionState>({ status: 'idle' });

  function clearFieldError(field: PasswordRecoveryField) {
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
    const result = validateNewPassword(new FormData(form));

    if (Object.keys(result.errors).length > 0) {
      setErrors(result.errors);
      setState({ status: 'idle' });
      const firstField = result.errors.password ? 'password' : 'passwordConfirmation';
      const control = form.elements.namedItem(firstField);
      if (control instanceof HTMLElement) {
        control.focus();
      }
      return;
    }

    setErrors({});
    setState({ status: 'submitting' });

    try {
      await updatePassword(result.password);
      router.replace('/auth?auth_status=password_updated');
      router.refresh();
    } catch (error) {
      setState({
        message:
          error instanceof SafeAuthError
            ? error.message
            : 'Não foi possível alterar sua senha agora. Solicite um novo link e tente novamente.',
        status: 'error',
      });
    }
  }

  const isSubmitting = state.status === 'submitting';

  return (
    <section
      aria-labelledby="reset-password-title"
      className="auth-panel-enter auth-panel-surface bg-surface-card grid w-full max-w-md gap-7 rounded-3xl border border-border p-5 sm:p-8"
    >
      <header className="auth-sequence grid gap-2 text-center">
        <p className="text-accent text-xs font-medium tracking-eyebrow uppercase">
          Proteger a conta
        </p>
        <h1 className="text-2xl font-semibold text-neutral-100" id="reset-password-title">
          Crie uma nova senha
        </h1>
        <p className="text-neutral-400 text-sm leading-relaxed">
          Escolha uma senha segura que você ainda não usa nesta conta.
        </p>
      </header>

      <form
        aria-busy={isSubmitting}
        className="auth-sequence grid gap-5"
        noValidate
        onSubmit={(event) => void handleSubmit(event)}
      >
        <PasswordField
          autoComplete="new-password"
          description={PASSWORD_REQUIREMENTS}
          disabled={isSubmitting}
          error={errors.password}
          label="Nova senha"
          maxLength={AUTH_LIMITS.password.max}
          name="password"
          onChange={() => clearFieldError('password')}
          placeholder="Crie uma senha segura"
          required
        />

        <PasswordField
          autoComplete="new-password"
          disabled={isSubmitting}
          error={errors.passwordConfirmation}
          label="Confirme a nova senha"
          maxLength={AUTH_LIMITS.password.max}
          name="passwordConfirmation"
          onChange={() => clearFieldError('passwordConfirmation')}
          placeholder="Digite a senha novamente"
          required
        />

        <Button className="w-full" disabled={isSubmitting} size="large" type="submit">
          {isSubmitting ? <LoadingSpinner /> : null}
          <span
            key={isSubmitting ? 'submitting' : 'idle'}
            className="auth-icon-swap"
            aria-live="polite"
          >
            {isSubmitting ? 'Alterando…' : 'Alterar senha'}
          </span>
        </Button>
      </form>

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
        href="/auth/forgot-password"
      >
        Solicitar outro link
      </Link>
    </section>
  );
}
