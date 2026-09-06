'use client';

import { Button, Input } from '@vavito/ui';
import { RefreshCcw } from 'lucide-react';

import { LoadingSpinner } from '@web/components/feedback/loading-spinner';

import { ArticleEditor } from '../editor/article-editor';
import { useAdminDraft } from './admin-draft-provider';

export function AdminDraftWorkspace() {
  const {
    draft,
    errorCode,
    errorMessage,
    isReady,
    phase,
    postStatus,
    retry,
    setContent,
    setExcerpt,
    setSlug,
    setTitle,
  } = useAdminDraft();

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

  const isArchived = postStatus === 'ARCHIVED';

  return (
    <article className="relative flex flex-1 flex-col gap-8">
      <header className="grid gap-4">
        <p className="text-accent text-xs font-medium tracking-eyebrow uppercase">Editor</p>
        {isArchived ? (
          <p
            className="rounded-xl border border-border bg-surface-card px-4 py-3 text-sm text-neutral-300"
            role="status"
          >
            Este artigo está arquivado. Restaure-o como rascunho para voltar a editar.
          </p>
        ) : null}
        <label className="sr-only" htmlFor="article-title">
          Título do artigo
        </label>
        <textarea
          className="placeholder:text-neutral-600 min-h-24 w-full resize-none bg-transparent text-4xl leading-tight font-semibold text-neutral-100 outline-none sm:text-5xl"
          disabled={isArchived}
          id="article-title"
          maxLength={200}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Título do artigo"
          rows={2}
          value={draft.title}
        />
        <label className="sr-only" htmlFor="article-excerpt">
          Resumo do artigo
        </label>
        <textarea
          className="placeholder:text-neutral-600 min-h-20 w-full resize-none bg-transparent text-lg leading-relaxed text-neutral-300 outline-none disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isArchived}
          id="article-excerpt"
          maxLength={500}
          onChange={(event) => setExcerpt(event.target.value)}
          placeholder="Escreva um resumo para apresentar o artigo"
          rows={2}
          value={draft.excerpt}
        />
        <Input
          autoCapitalize="none"
          autoComplete="off"
          className="font-mono"
          disabled={isArchived}
          error={errorCode === 'SLUG_ALREADY_EXISTS' ? errorMessage : undefined}
          label="Endereço do artigo"
          maxLength={255}
          onChange={(event) => setSlug(event.target.value)}
          placeholder="meu-artigo"
          spellCheck={false}
          value={draft.slug}
        />
      </header>

      <ArticleEditor editable={!isArchived} initialContent={draft.content} onChange={setContent} />
    </article>
  );
}
