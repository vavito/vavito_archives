'use client';

import { Button } from '@vavito/ui';
import { RefreshCcw } from 'lucide-react';

import { LoadingSpinner } from '@web/components/feedback/loading-spinner';

import { ArticleEditor } from '../editor/article-editor';
import { useAdminDraft } from './admin-draft-provider';

export function AdminDraftWorkspace() {
  const { draft, errorMessage, isReady, phase, retry, setContent, setTitle } = useAdminDraft();

  if (!isReady) {
    if (phase === 'error') {
      return (
        <section
          className="bg-surface-card mx-auto grid w-full max-w-2xl justify-items-center gap-4 rounded-2xl border border-border p-8 text-center"
          role="alert"
        >
          <h1 className="text-xl font-semibold text-neutral-100">
            Não foi possível abrir o editor
          </h1>
          <p className="text-sm leading-relaxed text-neutral-400">
            {errorMessage ?? 'Não foi possível recuperar seu rascunho agora.'}
          </p>
          <Button onClick={retry} variant="secondary">
            <RefreshCcw aria-hidden="true" />
            Tentar novamente
          </Button>
        </section>
      );
    }

    return (
      <div aria-live="polite" className="grid flex-1 place-items-center" role="status">
        <span className="flex items-center gap-2 text-sm text-neutral-400">
          <LoadingSpinner />
          Recuperando seu rascunho…
        </span>
      </div>
    );
  }

  return (
    <article className="relative flex flex-1 flex-col gap-8">
      <header className="grid gap-4">
        <p className="text-accent text-xs font-medium tracking-eyebrow uppercase">Editor</p>
        <label className="sr-only" htmlFor="article-title">
          Título do artigo
        </label>
        <textarea
          className="placeholder:text-neutral-600 min-h-24 w-full resize-none bg-transparent text-4xl leading-tight font-semibold text-neutral-100 outline-none sm:text-5xl"
          id="article-title"
          maxLength={200}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Título do artigo"
          rows={2}
          value={draft.title}
        />
      </header>

      <ArticleEditor initialContent={draft.content} onChange={setContent} />
    </article>
  );
}
