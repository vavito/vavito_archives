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

interface CampaignPostOption {
  id: string;
  title: string;
}

export function AdminCampaignForm({ posts }: Readonly<{ posts: readonly CampaignPostOption[] }>) {
  const router = useRouter();
  const [postIds, setPostIds] = useState<string[]>([]);
  const [subject, setSubject] = useState('Leituras selecionadas do Vavito Archives');
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
        const result = await createCampaignAction({ postIds, subject, previewText });
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
      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium text-neutral-200">
          Artigos da campanha ({postIds.length}/5)
        </legend>
        {posts.map((post) => {
          const selected = postIds.includes(post.id);
          return (
            <label
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4 transition-colors hover:border-accent"
              key={post.id}
            >
              <input
                checked={selected}
                className="mt-1 size-4 accent-[var(--color-accent)]"
                disabled={pending || (!selected && postIds.length >= 5)}
                onChange={() =>
                  setPostIds((current) =>
                    selected ? current.filter((id) => id !== post.id) : [...current, post.id],
                  )
                }
                type="checkbox"
              />
              <span className="text-sm text-neutral-300 [overflow-wrap:anywhere]">
                {post.title}
              </span>
            </label>
          );
        })}
      </fieldset>
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
      <Button type="submit" disabled={pending || !subject.trim() || postIds.length === 0}>
        {pending ? <LoadingSpinner /> : null}
        {pending ? 'Criando…' : 'Criar rascunho e revisar'}
      </Button>
      {feedback ? (
        <ActionFeedback key={feedback.id} feedback={feedback} onDismiss={dismiss} />
      ) : null}
    </form>
  );
}
