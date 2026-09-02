'use client';

import { Button } from '@vavito/ui';
import { CheckCircle2, MailCheck, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';

import { LoadingSpinner } from '@web/components/feedback/loading-spinner';

import { resendSignUpConfirmation, SafeAuthError } from '../services/auth.service';

interface SignUpConfirmationProps {
  email: string;
  emailRedirectTo: string;
  onReturnToSignIn: () => void;
}

const RESEND_COOLDOWN_SECONDS = 60;

export function SignUpConfirmation({
  email,
  emailRedirectTo,
  onReturnToSignIn,
}: Readonly<SignUpConfirmationProps>) {
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const isCoolingDown = cooldown > 0;

  useEffect(() => {
    if (!isCoolingDown) {
      return;
    }

    const timer = window.setInterval(() => {
      setCooldown((current) => Math.max(0, current - 1));
    }, 1_000);

    return () => window.clearInterval(timer);
  }, [isCoolingDown]);

  async function handleResend() {
    if (isCoolingDown || isResending) {
      return;
    }

    setFeedback(null);
    setIsResending(true);

    try {
      await resendSignUpConfirmation(email, emailRedirectTo);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setFeedback('Enviamos um novo link de confirmação.');
    } catch (error) {
      setFeedback(
        error instanceof SafeAuthError
          ? error.message
          : 'Não foi possível reenviar o link agora. Tente novamente.',
      );
    } finally {
      setIsResending(false);
    }
  }

  return (
    <section
      aria-labelledby="sign-up-confirmation-title"
      className="auth-panel-enter auth-panel-surface bg-surface-card grid w-full max-w-md justify-items-center gap-6 rounded-3xl border border-border p-6 text-center sm:p-8"
    >
      <span className="bg-accent/10 grid size-16 place-items-center rounded-full text-accent">
        <MailCheck aria-hidden="true" className="size-8" />
      </span>
      <header className="auth-sequence grid gap-3">
        <p className="text-accent text-xs font-medium tracking-eyebrow uppercase">Quase pronto</p>
        <h1 className="text-2xl font-semibold text-neutral-100" id="sign-up-confirmation-title">
          Cadastro realizado!
        </h1>
        <p className="text-neutral-400 text-sm leading-relaxed">
          Confirme o link que enviamos para{' '}
          <strong className="font-medium text-neutral-200">{email}</strong> para ativar sua conta.
        </p>
      </header>

      <div className="grid w-full gap-3">
        <Button
          disabled={isCoolingDown || isResending}
          onClick={() => void handleResend()}
          size="large"
          type="button"
        >
          {isResending ? <LoadingSpinner /> : <RotateCcw aria-hidden="true" />}
          {isResending
            ? 'Reenviando…'
            : isCoolingDown
              ? `Reenviar em ${cooldown}s`
              : 'Reenviar e-mail'}
        </Button>
        <Button onClick={onReturnToSignIn} type="button" variant="ghost">
          Voltar para entrar
        </Button>
      </div>

      {feedback ? (
        <p
          aria-live="polite"
          className="auth-feedback-enter flex items-start gap-2 text-sm leading-relaxed text-accent"
          role="status"
        >
          <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {feedback}
        </p>
      ) : null}
    </section>
  );
}
