'use client';

import { Button, Input } from '@vavito/ui';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useCallback, useRef, useState, useTransition, type FormEvent } from 'react';
import {
  ActionFeedback,
  type ActionFeedbackMessage,
} from '@web/components/feedback/action-feedback';
import { LoadingSpinner } from '@web/components/feedback/loading-spinner';
import { createCampaignAction } from '../actions/admin-campaign.actions';

export function AdminCampaignForm({ postId, title }: Readonly<{ postId: string; title: string }>) {
  const router = useRouter();
  const [subject, setSubject] = useState(`Novo artigo: ${title}`.slice(0, 255));
  const [previewText, setPreviewText] = useState('');
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<ActionFeedbackMessage | null>(null);
  const busy = useRef(false);
  const dismiss = useCallback(() => setFeedback(null), []);
  function submit(event: FormEvent) {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true;
    startTransition(async () => {
      try {
        const result = await createCampaignAction({ postId, subject, previewText });
        if (result.ok) {
          router.push(`/admin/campaigns/${result.data.id}` as Route);
          return;
        }
        setFeedback({ id: Date.now(), message: result.message, tone: 'error' });
      } catch {
        setFeedback({
          id: Date.now(),
          message:
            'Não conseguimos confirmar a criação. Confira a lista de campanhas antes de tentar novamente.',
          tone: 'error',
        });
      } finally {
        busy.current = false;
      }
    });
  }
  return (
    <form
      onSubmit={submit}
      className="grid gap-5 rounded-2xl border border-border bg-surface-card p-6"
    >
      <p className="text-neutral-400 [overflow-wrap:anywhere]">Artigo: {title}</p>
      <Input
        label="Assunto do email"
        required
        maxLength={255}
        value={subject}
        onChange={(event) => setSubject(event.target.value)}
        disabled={pending}
      />
      <Input
        label="Texto de prévia"
        maxLength={255}
        value={previewText}
        onChange={(event) => setPreviewText(event.target.value)}
        disabled={pending}
      />
      <p className="text-sm text-neutral-500">
        Você poderá revisar o email antes de confirmar o envio.
      </p>
      <Button type="submit" disabled={pending || !subject.trim()}>
        {pending ? <LoadingSpinner /> : null}
        {pending ? 'Criando…' : 'Criar rascunho e revisar'}
      </Button>
      {feedback ? (
        <ActionFeedback key={feedback.id} feedback={feedback} onDismiss={dismiss} />
      ) : null}
    </form>
  );
}
