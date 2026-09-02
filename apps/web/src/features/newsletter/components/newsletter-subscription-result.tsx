'use client';

import { buttonVariants, cn } from '@vavito/ui';
import { CheckCircle2, CircleAlert } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { LoadingSpinner } from '@web/components/feedback/loading-spinner';

import {
  confirmNewsletterSubscription,
  unsubscribeFromNewsletter,
} from '../services/manage-newsletter-subscription';

type NewsletterLinkAction = 'confirm' | 'unsubscribe';
type ProcessingState = 'error' | 'loading' | 'success';

interface NewsletterSubscriptionResultProps {
  action: NewsletterLinkAction;
}

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

const CONTENT = {
  confirm: {
    error: 'Este link de confirmação não é válido ou já foi utilizado.',
    loading: 'Confirmando sua inscrição…',
    success: 'Inscrição confirmada! Você receberá os próximos artigos por e-mail.',
  },
  unsubscribe: {
    error: 'Não foi possível cancelar a inscrição agora. Tente novamente em instantes.',
    loading: 'Cancelando sua inscrição…',
    success: 'Inscrição cancelada. Você não receberá novos envios da newsletter.',
  },
} as const;

export function NewsletterSubscriptionResult({
  action,
}: Readonly<NewsletterSubscriptionResultProps>) {
  const hasStarted = useRef(false);
  const [state, setState] = useState<ProcessingState>('loading');

  useEffect(() => {
    if (hasStarted.current) {
      return;
    }

    hasStarted.current = true;
    const token = new URLSearchParams(window.location.hash.slice(1)).get('token');
    window.history.replaceState(
      window.history.state,
      '',
      `${window.location.pathname}${window.location.search}`,
    );

    if (!token || !TOKEN_PATTERN.test(token)) {
      void Promise.resolve().then(() => setState('error'));
      return;
    }

    const request =
      action === 'confirm'
        ? confirmNewsletterSubscription(token)
        : unsubscribeFromNewsletter(token);

    void request.then(() => setState('success')).catch(() => setState('error'));
  }, [action]);

  const Icon = state === 'success' ? CheckCircle2 : state === 'error' ? CircleAlert : null;

  return (
    <section
      aria-live="polite"
      className="motion-card bg-surface-card grid justify-items-center gap-5 rounded-2xl border border-border p-6 text-center sm:p-8"
    >
      {state === 'loading' ? <LoadingSpinner className="size-8 text-accent" /> : null}
      {Icon ? (
        <Icon
          aria-hidden="true"
          className={cn('size-9', state === 'success' ? 'text-accent' : 'text-destructive')}
        />
      ) : null}
      <p
        className={cn(
          'max-w-reading text-sm leading-relaxed sm:text-base',
          state === 'error' ? 'text-neutral-300' : 'text-neutral-200',
        )}
        role={state === 'error' ? 'alert' : 'status'}
      >
        {CONTENT[action][state]}
      </p>
      {state !== 'loading' ? (
        <Link className={buttonVariants({ variant: 'secondary' })} href="/">
          Voltar para a página inicial
        </Link>
      ) : null}
    </section>
  );
}
