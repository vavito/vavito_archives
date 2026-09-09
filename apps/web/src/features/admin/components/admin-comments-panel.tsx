'use client';

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Input,
  chipVariants,
  cn,
} from '@vavito/ui';
import Link from 'next/link';
import type { Route } from 'next';
import { useCallback, useRef, useState, useTransition } from 'react';
import {
  ActionFeedback,
  type ActionFeedbackMessage,
} from '@web/components/feedback/action-feedback';
import { LoadingSpinner } from '@web/components/feedback/loading-spinner';
import { moderateCommentAction } from '../actions/admin-comment.actions';
import {
  commentStatusLabels,
  type AdminComment,
  type AdminCommentsPage,
  type ModerationStatus,
} from '../types/admin-community.types';
import { AdminCommunityPagination } from './admin-community-pagination';

export function AdminCommentsPanel({
  data,
  status,
}: Readonly<{ data: AdminCommentsPage; status?: AdminComment['status'] }>) {
  const [selected, setSelected] = useState<{
    comment: AdminComment;
    status: ModerationStatus;
  } | null>(null);
  const [reason, setReason] = useState('');
  const [feedback, setFeedback] = useState<ActionFeedbackMessage | null>(null);
  const [pending, startTransition] = useTransition();
  const busy = useRef(false);
  const dismiss = useCallback(() => setFeedback(null), []);
  const labels = { VISIBLE: 'Aprovar', HIDDEN: 'Ocultar', SPAM: 'Marcar como spam' };

  function confirm() {
    if (!selected || busy.current) return;
    busy.current = true;
    startTransition(async () => {
      try {
        const result = await moderateCommentAction(selected.comment.id, selected.status, reason);
        setFeedback({
          id: Date.now(),
          message: result.message,
          tone: result.ok ? 'success' : 'error',
        });
        setSelected(null);
      } catch {
        setFeedback({
          id: Date.now(),
          message: 'Não foi possível concluir a moderação. Atualize a página e tente novamente.',
          tone: 'error',
        });
      } finally {
        busy.current = false;
      }
    });
  }

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 sm:px-6">
      <header>
        <h1 className="text-3xl font-semibold">Comentários</h1>
        <p className="mt-2 text-neutral-400">
          Os comentários aparecem após a publicação. Revise a conversa e modere quando necessário.
        </p>
      </header>
      <nav aria-label="Filtrar comentários" className="flex flex-wrap gap-2">
        <Link className={cn(chipVariants({ active: !status }))} href="/admin/comments">
          Todos
        </Link>
        {Object.entries(commentStatusLabels).map(([value, label]) => (
          <Link
            aria-current={status === value ? 'page' : undefined}
            className={cn(chipVariants({ active: status === value }))}
            href={`/admin/comments?status=${value}` as Route}
            key={value}
          >
            {label}
          </Link>
        ))}
      </nav>
      <p className="text-sm text-neutral-500">{data.meta.total} comentários encontrados</p>
      {data.items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-neutral-400">
          Nenhum comentário neste filtro.
        </p>
      ) : (
        <ul className="grid gap-4">
          {data.items.map((comment) => (
            <li
              className="min-w-0 rounded-2xl border border-border bg-surface-card p-5"
              key={comment.id}
            >
              <div className="flex flex-wrap justify-between gap-3">
                <p className="font-medium">
                  {comment.author?.displayName ?? 'Conta excluída'}{' '}
                  <span className="text-sm text-neutral-500">
                    · {comment.parentId ? 'Resposta' : 'Comentário'}
                  </span>
                </p>
                <span className="text-sm text-accent">{commentStatusLabels[comment.status]}</span>
              </div>
              <p className="my-4 whitespace-pre-wrap text-neutral-300 [overflow-wrap:anywhere]">
                {comment.content ?? 'Comentário excluído.'}
              </p>
              {comment.moderationReason ? (
                <p className="mb-4 text-sm text-neutral-500 [overflow-wrap:anywhere]">
                  Motivo: {comment.moderationReason}
                </p>
              ) : null}
              <div className="flex flex-wrap items-center gap-2">
                <div className="mr-auto flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                  <span
                    className="max-w-80 truncate text-sm text-neutral-400"
                    title={comment.postTitle}
                  >
                    Artigo:{' '}
                    <strong className="font-medium text-neutral-200">{comment.postTitle}</strong>
                  </span>
                  <Link
                    href={
                      (comment.postStatus === 'PUBLISHED' && comment.postSlug
                        ? `/artigos/${comment.postSlug}`
                        : `/admin/posts/${comment.postId}/preview`) as Route
                    }
                    className="text-sm text-accent hover:underline"
                  >
                    Ver artigo
                  </Link>
                </div>
                {comment.status !== 'DELETED'
                  ? (['VISIBLE', 'HIDDEN', 'SPAM'] as const)
                      .filter((value) => value !== comment.status)
                      .map((value) => (
                        <Button
                          disabled={pending}
                          key={value}
                          onClick={() => {
                            setReason('');
                            setSelected({ comment, status: value });
                          }}
                          size="small"
                          variant={value === 'SPAM' ? 'danger' : 'secondary'}
                        >
                          {labels[value]}
                        </Button>
                      ))
                  : null}
              </div>
            </li>
          ))}
        </ul>
      )}
      <AdminCommunityPagination
        basePath="/admin/comments"
        page={data.meta.page}
        totalPages={data.meta.totalPages}
        filters={status ? { status } : {}}
      />
      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open && !pending) setSelected(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected ? labels[selected.status] : 'Moderar comentário'}?</DialogTitle>
            <DialogDescription>
              {selected?.status === 'VISIBLE'
                ? 'O comentário voltará a aparecer para os leitores.'
                : 'O comentário deixará de aparecer na conversa pública.'}
            </DialogDescription>
          </DialogHeader>
          <Input
            label="Motivo (opcional)"
            maxLength={500}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            disabled={pending}
          />
          <DialogFooter>
            <Button variant="secondary" disabled={pending} onClick={() => setSelected(null)}>
              Cancelar
            </Button>
            <Button
              variant={selected?.status === 'SPAM' ? 'danger' : 'primary'}
              disabled={pending}
              onClick={confirm}
            >
              {pending ? <LoadingSpinner /> : null}
              {pending ? 'Atualizando…' : 'Confirmar moderação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {feedback ? (
        <ActionFeedback key={feedback.id} feedback={feedback} onDismiss={dismiss} />
      ) : null}
    </main>
  );
}
