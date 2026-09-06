'use client';

import { Button, buttonVariants, cn } from '@vavito/ui';
import { AlertCircle, ArrowLeft, Check, Eye, Files, Save } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';

import { LoadingSpinner } from '@web/components/feedback/loading-spinner';

import { useAdminDraft } from './admin-draft-provider';
import { AdminPostActions } from './admin-post-actions';

const statusMessages = {
  dirty: 'Alterações pendentes',
  idle: 'Comece a escrever para criar o rascunho',
  loading: 'Recuperando rascunho…',
  saved: 'Rascunho salvo',
  saving: 'Salvando rascunho…',
} as const;

export function AdminEditorHeader() {
  const { draft, errorMessage, isReady, phase, postId, postStatus, retry, saveNow, setPostStatus } =
    useAdminDraft();
  const canSave = isReady && (phase === 'dirty' || phase === 'error');
  const canPreview = Boolean(postId) && phase === 'saved';
  const isError = phase === 'error';

  return (
    <header className="site-header-enter bg-background/90 sticky top-0 z-40 border-b border-divider backdrop-blur">
      <div className="mx-auto flex min-h-16 w-full items-center gap-3 px-4 sm:px-6">
        <Link
          aria-label="Voltar ao site"
          className="text-neutral-400 hover:bg-surface-raised hover:text-neutral-100 grid size-10 shrink-0 place-items-center rounded-full transition-colors"
          href="/"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
        </Link>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-neutral-200">
            {draft.title.trim() || 'Novo artigo'}
          </p>
          <p
            aria-live={isError ? 'assertive' : 'polite'}
            className={
              isError
                ? 'flex items-center gap-1 text-xs text-destructive'
                : 'text-xs text-neutral-500'
            }
            role={isError ? 'alert' : 'status'}
          >
            {phase === 'saving' ? <LoadingSpinner className="size-3" /> : null}
            {phase === 'saved' ? <Check aria-hidden="true" className="mr-1 inline size-3" /> : null}
            {isError ? (
              <>
                <AlertCircle aria-hidden="true" className="size-3 shrink-0" />
                <span className="truncate">
                  {errorMessage ?? 'Não foi possível salvar o rascunho.'}
                </span>
              </>
            ) : (
              statusMessages[phase]
            )}
          </p>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Link
            aria-label="Ver todos os artigos"
            className={cn(buttonVariants({ size: 'icon', variant: 'ghost' }))}
            href="/admin/posts"
          >
            <Files aria-hidden="true" />
          </Link>
          <Link
            aria-disabled={!canPreview}
            aria-label="Visualizar artigo"
            className={cn(
              buttonVariants({ size: 'icon', variant: 'ghost' }),
              !canPreview && 'pointer-events-none opacity-45',
            )}
            href={(canPreview ? `/admin/posts/${postId}/preview` : '#') as Route}
            tabIndex={canPreview ? undefined : -1}
          >
            <Eye aria-hidden="true" />
          </Link>
          <Button
            aria-label={isError ? 'Tentar novamente' : 'Salvar rascunho'}
            disabled={!canSave}
            onClick={isError ? retry : saveNow}
            size="small"
            variant="secondary"
          >
            {phase === 'saving' ? <LoadingSpinner /> : <Save aria-hidden="true" />}
            <span className="hidden sm:inline">{isError ? 'Tentar novamente' : 'Salvar'}</span>
          </Button>
          {postId && postStatus ? (
            <AdminPostActions
              compact
              disabled={phase !== 'saved'}
              initialStatus={postStatus}
              onStatusChange={setPostStatus}
              postId={postId}
              title={draft.title}
            />
          ) : (
            <Button disabled size="small">
              Publicar
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
