'use client';

import { ApiClientError } from '@vavito/api-client';
import { Button, Input } from '@vavito/ui';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { subscribeToNewsletter } from '../services/subscribe-newsletter';
import { LoadingSpinner } from '@web/components/feedback/loading-spinner';

type SubmissionState =
  { status: 'idle' } | { message: string; status: 'error' | 'success' } | { status: 'submitting' };

export function NewsletterSignup() {
  const [state, setState] = useState<SubmissionState>({ status: 'idle' });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const emailField = formData.get('email');

    if (typeof emailField !== 'string') {
      setState({ message: 'Informe um endereço de e-mail válido.', status: 'error' });
      return;
    }

    const email = emailField.trim();

    setState({ status: 'submitting' });

    try {
      await subscribeToNewsletter(email);

      form.reset();
      setState({
        message: 'Confira sua caixa de entrada para confirmar a inscrição.',
        status: 'success',
      });
    } catch (error) {
      setState({
        message:
          error instanceof ApiClientError
            ? error.message
            : 'Não foi possível solicitar a inscrição agora. Tente novamente.',
        status: 'error',
      });
    }
  }

  const isSubmitting = state.status === 'submitting';

  return (
    <section
      aria-labelledby="newsletter-title"
      className="motion-card bg-surface-card grid gap-6 rounded-3xl border border-border p-6 sm:p-8"
    >
      <div className="grid max-w-prose gap-3">
        <p className="text-accent font-mono text-xs tracking-eyebrow uppercase">Newsletter</p>
        <h2 className="text-neutral-100 text-2xl leading-tight font-semibold" id="newsletter-title">
          Novos textos, sem ruído.
        </h2>
        <p className="text-neutral-400 text-sm leading-relaxed sm:text-base">
          Receba um aviso quando um novo artigo for publicado. A inscrição só é ativada depois da
          confirmação por e-mail.
        </p>
      </div>

      <form className="grid gap-4" onSubmit={(event) => void handleSubmit(event)}>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <Input
            autoComplete="email"
            disabled={isSubmitting}
            label="Seu melhor e-mail"
            name="email"
            placeholder="voce@exemplo.com"
            required
            type="email"
          />
          <Button className="w-full sm:w-auto" disabled={isSubmitting} size="large" type="submit">
            {isSubmitting ? <LoadingSpinner /> : null}
            {isSubmitting ? 'Enviando…' : 'Quero receber'}
            {!isSubmitting ? <ArrowRight aria-hidden="true" /> : null}
          </Button>
        </div>

        <label className="text-neutral-500 flex items-start gap-2 text-xs leading-relaxed">
          <input
            className="accent-accent mt-0.5 size-4 shrink-0"
            disabled={isSubmitting}
            name="consent"
            required
            type="checkbox"
          />
          Concordo em receber os novos artigos por e-mail e posso cancelar a qualquer momento.
        </label>

        {state.status === 'success' ? (
          <p
            aria-live="polite"
            className="feedback-enter text-accent flex items-center gap-2 text-sm"
            role="status"
          >
            <CheckCircle2 aria-hidden="true" className="size-4" />
            {state.message}
          </p>
        ) : null}
        {state.status === 'error' ? (
          <p aria-live="assertive" className="feedback-enter text-destructive text-sm" role="alert">
            {state.message}
          </p>
        ) : null}
      </form>
    </section>
  );
}
