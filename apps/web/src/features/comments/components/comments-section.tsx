'use client';

import { Button } from '@vavito/ui';
import { MessageCircle, RotateCcw } from 'lucide-react';
import { useCallback, useState } from 'react';

import {
  ActionFeedback,
  type ActionFeedbackMessage,
} from '@web/components/feedback/action-feedback';
import { AuthRequiredDialog } from '@web/components/feedback/auth-required-dialog';
import { LoadingSpinner } from '@web/components/feedback/loading-spinner';

import { addComment, removeCommentOptimistically, replaceComment } from '../services/comment-tree';
import {
  editComment,
  loadComments,
  publishComment,
  removeComment,
  SafeCommentActionError,
} from '../services/comments.service';
import type { CommentItem, CommentsPageData, CommentViewer } from '../types/comments.types';
import { CommentCard } from './comment-card';
import { CommentForm } from './comment-form';

interface CommentsSectionProps {
  initialData: CommentsPageData | null;
  postId: string;
  slug: string;
  viewer: CommentViewer | null;
}

let pendingCommentSequence = 0;

function optimisticComment(
  content: string,
  parentId: string | null,
  postId: string,
  viewer: CommentViewer,
): CommentItem {
  return {
    author: {
      avatarUrl: viewer.avatarUrl,
      displayName: viewer.displayName,
      id: viewer.id,
    },
    content,
    createdAt: new Date().toISOString(),
    edited: false,
    editedAt: null,
    id: `pending-${++pendingCommentSequence}`,
    parentId,
    postId,
    replies: [],
    status: 'VISIBLE',
  };
}

function friendlyError(error: unknown, fallback: string): string {
  return error instanceof SafeCommentActionError ? error.message : fallback;
}

export function CommentsSection({
  initialData,
  postId,
  slug,
  viewer,
}: Readonly<CommentsSectionProps>) {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [data, setData] = useState<CommentsPageData | null>(initialData);
  const [feedback, setFeedback] = useState<ActionFeedbackMessage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const dismissFeedback = useCallback(() => setFeedback(null), []);

  function showFeedback(message: string, tone: ActionFeedbackMessage['tone']) {
    setFeedback({ id: Date.now(), message, tone });
  }

  async function reload() {
    setIsLoading(true);
    try {
      setData(await loadComments(slug, 1));
    } catch (error) {
      showFeedback(
        friendlyError(error, 'Não foi possível carregar os comentários agora.'),
        'error',
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function loadMore() {
    if (!data || data.meta.page >= data.meta.totalPages) return;
    setIsLoading(true);
    try {
      const next = await loadComments(slug, data.meta.page + 1);
      setData({ items: [...data.items, ...next.items], meta: next.meta });
    } catch (error) {
      showFeedback(friendlyError(error, 'Não foi possível carregar mais comentários.'), 'error');
    } finally {
      setIsLoading(false);
    }
  }

  async function create(content: string, parentId: string | null): Promise<boolean> {
    if (!viewer) {
      setAuthDialogOpen(true);
      return false;
    }

    const pending = optimisticComment(content, parentId, postId, viewer);
    const previous = data;
    const base: CommentsPageData = previous ?? {
      items: [],
      meta: { limit: 20, page: 1, total: 0, totalPages: 0 },
    };

    setPendingAction(pending.id);
    setData({
      items: addComment(base.items, pending, parentId),
      meta: parentId ? base.meta : { ...base.meta, total: base.meta.total + 1 },
    });

    try {
      const created = await publishComment(slug, content, parentId);
      setData((current) =>
        current
          ? { ...current, items: replaceComment(current.items, pending.id, created) }
          : current,
      );
      showFeedback(parentId ? 'Resposta publicada.' : 'Comentário publicado.', 'success');
      return true;
    } catch (error) {
      setData(previous);
      showFeedback(
        friendlyError(error, 'Não foi possível publicar seu comentário agora.'),
        'error',
      );
      return false;
    } finally {
      setPendingAction(null);
    }
  }

  async function update(comment: CommentItem, content: string): Promise<boolean> {
    if (!data) return false;
    const previous = data;
    setPendingAction(comment.id);
    setData({
      ...data,
      items: replaceComment(data.items, comment.id, {
        ...comment,
        content,
        edited: true,
        editedAt: new Date().toISOString(),
      }),
    });

    try {
      const updated = await editComment(slug, comment.id, content);
      setData((current) =>
        current
          ? { ...current, items: replaceComment(current.items, comment.id, updated) }
          : current,
      );
      showFeedback('Comentário atualizado.', 'success');
      return true;
    } catch (error) {
      setData(previous);
      showFeedback(friendlyError(error, 'Não foi possível editar seu comentário agora.'), 'error');
      return false;
    } finally {
      setPendingAction(null);
    }
  }

  async function remove(comment: CommentItem): Promise<boolean> {
    if (!data) return false;
    const previous = data;
    const removesRoot = !comment.parentId && comment.replies.length === 0;
    setPendingAction(comment.id);
    setData({
      items: removeCommentOptimistically(data.items, comment.id),
      meta: removesRoot ? { ...data.meta, total: Math.max(0, data.meta.total - 1) } : data.meta,
    });

    try {
      await removeComment(slug, comment.id);
      showFeedback('Comentário excluído.', 'success');
      return true;
    } catch (error) {
      setData(previous);
      showFeedback(friendlyError(error, 'Não foi possível excluir seu comentário agora.'), 'error');
      return false;
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <section
      aria-labelledby="comments-title"
      className="mx-auto grid min-w-0 w-full max-w-reading gap-7 px-4 pt-6 pb-12 sm:px-6 lg:px-0"
    >
      {feedback ? <ActionFeedback feedback={feedback} onDismiss={dismissFeedback} /> : null}
      <header className="grid gap-2">
        <p className="text-accent font-mono text-xs tracking-eyebrow uppercase">Conversa</p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-neutral-100 text-2xl font-semibold" id="comments-title">
              Comentários
            </h2>
            <p className="text-neutral-500 mt-1 text-sm">
              {data
                ? `${data.meta.total.toLocaleString('pt-BR')} ${data.meta.total === 1 ? 'conversa' : 'conversas'}`
                : 'Participe da conversa.'}
            </p>
          </div>
        </div>
      </header>

      <div className="motion-card bg-surface-card rounded-2xl border border-border p-4 sm:p-5">
        <CommentForm
          isPending={pendingAction !== null}
          label="Deixe seu comentário"
          onSubmit={(content) => create(content, null)}
          placeholder="Compartilhe sua opinião sobre o artigo…"
          submitLabel="Comentar"
        />
      </div>

      {!data ? (
        <div className="bg-surface-card grid justify-items-center gap-4 rounded-2xl border border-border p-8 text-center">
          <MessageCircle aria-hidden="true" className="text-neutral-600 size-8" />
          <div className="grid gap-1">
            <p className="text-neutral-200 font-medium">Os comentários não carregaram.</p>
            <p className="text-neutral-500 text-sm">
              Você pode tentar novamente sem sair do artigo.
            </p>
          </div>
          <Button disabled={isLoading} onClick={() => void reload()} variant="secondary">
            {isLoading ? <LoadingSpinner /> : <RotateCcw aria-hidden="true" />}
            {isLoading ? 'Tentando novamente…' : 'Tentar novamente'}
          </Button>
        </div>
      ) : data.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="text-neutral-300 text-sm">Seja a primeira pessoa a comentar.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {data.items.map((comment) => (
            <CommentCard
              comment={comment}
              isPending={pendingAction !== null}
              key={comment.id}
              onDelete={remove}
              onEdit={update}
              onReply={(parent, content) => create(content, parent.id)}
              requestAuthentication={() => setAuthDialogOpen(true)}
              viewer={viewer}
            />
          ))}
        </div>
      )}

      {data && data.meta.page < data.meta.totalPages ? (
        <Button
          className="justify-self-center"
          disabled={isLoading || pendingAction !== null}
          onClick={() => void loadMore()}
          variant="secondary"
        >
          {isLoading ? <LoadingSpinner /> : null}
          {isLoading ? 'Carregando…' : 'Carregar mais comentários'}
        </Button>
      ) : null}

      <AuthRequiredDialog
        articlePath={`/artigos/${slug}`}
        description="Para comentar ou responder, entre na sua conta ou crie uma gratuitamente. Depois você voltará para este artigo."
        onOpenChange={setAuthDialogOpen}
        open={authDialogOpen}
      />
    </section>
  );
}
