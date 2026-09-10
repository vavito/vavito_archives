'use client';

import { Button, Input } from '@vavito/ui';
import { RefreshCcw } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { LoadingSpinner } from '@web/components/feedback/loading-spinner';

import { ArticleEditor } from '../editor/article-editor';
import { ArticleCoverField } from '../editor/article-cover-field';
import { ArticleTagsField } from '../editor/article-tags-field';
import { useAdminDraft } from './admin-draft-provider';

const EXCERPT_MAX_HEIGHT_PX = 320;
const TITLE_MAX_HEIGHT_PX = 240;

function resizeField(field: HTMLTextAreaElement, maxHeight: number) {
  field.style.height = 'auto';
  field.style.height = `${Math.min(field.scrollHeight, maxHeight)}px`;
}

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
    setCover,
    setExcerpt,
    setSlug,
    setTagNames,
    setTitle,
  } = useAdminDraft();
  const excerptFieldRef = useRef<HTMLTextAreaElement | null>(null);
  const titleFieldRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (titleFieldRef.current) resizeField(titleFieldRef.current, TITLE_MAX_HEIGHT_PX);
    if (excerptFieldRef.current) resizeField(excerptFieldRef.current, EXCERPT_MAX_HEIGHT_PX);
  }, [draft.excerpt, draft.title]);

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
      <header className="grid gap-0">
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
          ref={titleFieldRef}
          className="placeholder:text-neutral-400 mt-4 min-h-16 max-h-60 w-full resize-none overflow-y-auto rounded-lg bg-transparent text-4xl leading-tight font-semibold text-neutral-100 sm:text-5xl"
          disabled={isArchived}
          id="article-title"
          maxLength={200}
          onChange={(event) => {
            resizeField(event.currentTarget, TITLE_MAX_HEIGHT_PX);
            setTitle(event.target.value);
          }}
          placeholder="Título do artigo"
          rows={1}
          value={draft.title}
        />
        <label className="sr-only" htmlFor="article-excerpt">
          Resumo do artigo
        </label>
        <textarea
          ref={excerptFieldRef}
          className="placeholder:text-neutral-400 mt-4 mb-4 min-h-14 max-h-80 w-full resize-none overflow-y-auto rounded-lg bg-transparent text-lg leading-relaxed text-neutral-300 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isArchived}
          id="article-excerpt"
          maxLength={500}
          onChange={(event) => {
            resizeField(event.currentTarget, EXCERPT_MAX_HEIGHT_PX);
            setExcerpt(event.target.value);
          }}
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
        <div className="mt-4">
          <ArticleTagsField
            disabled={isArchived}
            onChange={setTagNames}
            tagNames={draft.tagNames}
          />
        </div>
      </header>

      <ArticleCoverField
        altText={draft.coverAlt}
        disabled={isArchived}
        mediaId={draft.coverMediaId}
        positionX={draft.coverPositionX ?? 50}
        positionY={draft.coverPositionY ?? 50}
        scale={draft.coverScale ?? 100}
        onChange={setCover}
        url={draft.coverUrl}
      />

      <ArticleEditor editable={!isArchived} initialContent={draft.content} onChange={setContent} />
    </article>
  );
}
