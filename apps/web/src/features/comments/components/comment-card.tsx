'use client';

import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@vavito/ui';
import { MessageCircle, Pencil, Trash2, UserRound } from 'lucide-react';
import { useState } from 'react';

import type { CommentItem, CommentViewer } from '../types/comments.types';
import { CommentForm } from './comment-form';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

interface CommentCardProps {
  comment: CommentItem;
  isPending: boolean;
  isReply?: boolean;
  onDelete: (comment: CommentItem) => Promise<boolean>;
  onEdit: (comment: CommentItem, content: string) => Promise<boolean>;
  onReply: (comment: CommentItem, content: string) => Promise<boolean>;
  requestAuthentication: () => void;
  viewer: CommentViewer | null;
}

function CommentAvatar({ comment }: Readonly<{ comment: CommentItem }>) {
  if (comment.author?.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- URL pública resolvida pela API.
      <img
        alt=""
        className="size-9 shrink-0 rounded-full border border-border object-cover"
        decoding="async"
        src={comment.author.avatarUrl}
      />
    );
  }

  return (
    <span className="bg-surface-raised text-neutral-500 flex size-9 shrink-0 items-center justify-center rounded-full border border-border">
      <UserRound aria-hidden="true" className="size-4" />
    </span>
  );
}

export function CommentCard({
  comment,
  isPending,
  isReply = false,
  onDelete,
  onEdit,
  onReply,
  requestAuthentication,
  viewer,
}: Readonly<CommentCardProps>) {
  const [editor, setEditor] = useState<'edit' | 'reply' | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const deleted = comment.status === 'DELETED';
  const isAuthor = viewer?.id === comment.author?.id;
  const canDelete = Boolean(viewer && (isAuthor || viewer.role === 'ADMIN'));

  async function submitEdit(content: string) {
    const succeeded = await onEdit(comment, content);
    if (succeeded) setEditor(null);
    return succeeded;
  }

  async function submitReply(content: string) {
    const succeeded = await onReply(comment, content);
    if (succeeded) setEditor(null);
    return succeeded;
  }

  async function confirmDelete() {
    const succeeded = await onDelete(comment);
    if (succeeded) setDeleteDialogOpen(false);
  }

  return (
    <article
      className={isReply ? 'border-divider border-l pl-4 sm:pl-6' : 'border-divider border-b pb-6'}
    >
      <div className="flex gap-3">
        <CommentAvatar comment={comment} />
        <div className="min-w-0 flex-1">
          <header className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <strong className="text-neutral-200 text-sm font-medium">
              {comment.author?.displayName ?? 'Leitor'}
            </strong>
            <time className="text-neutral-600 font-mono text-[11px]" dateTime={comment.createdAt}>
              {dateFormatter.format(new Date(comment.createdAt))}
            </time>
          </header>

          {deleted ? (
            <p className="text-neutral-500 mt-2 text-sm italic">Comentário removido.</p>
          ) : (
            <>
              <p className="text-neutral-300 mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                {comment.content}
              </p>
              {comment.edited ? (
                <span className="text-neutral-600 mt-1 block text-[11px]">editado</span>
              ) : null}
            </>
          )}

          {!deleted ? (
            <div className="mt-3 flex flex-wrap items-center gap-1">
              {!isReply ? (
                <Button
                  disabled={isPending}
                  onClick={() => {
                    if (!viewer) requestAuthentication();
                    else setEditor(editor === 'reply' ? null : 'reply');
                  }}
                  size="small"
                  variant="ghost"
                >
                  <MessageCircle aria-hidden="true" />
                  Responder
                </Button>
              ) : null}
              {isAuthor ? (
                <Button
                  disabled={isPending}
                  onClick={() => setEditor(editor === 'edit' ? null : 'edit')}
                  size="small"
                  variant="ghost"
                >
                  <Pencil aria-hidden="true" />
                  Editar
                </Button>
              ) : null}
              {canDelete ? (
                <Button
                  disabled={isPending}
                  onClick={() => setDeleteDialogOpen(true)}
                  size="small"
                  variant="ghost"
                >
                  <Trash2 aria-hidden="true" />
                  Excluir
                </Button>
              ) : null}
            </div>
          ) : null}

          {editor === 'reply' ? (
            <div className="mt-4">
              <CommentForm
                autoFocus
                isPending={isPending}
                label={`Responder a ${comment.author?.displayName ?? 'este comentário'}`}
                onCancel={() => setEditor(null)}
                onSubmit={submitReply}
                placeholder="Escreva sua resposta…"
                submitLabel="Responder"
              />
            </div>
          ) : null}
          {editor === 'edit' ? (
            <div className="mt-4">
              <CommentForm
                autoFocus
                initialContent={comment.content ?? ''}
                isPending={isPending}
                label="Editar comentário"
                onCancel={() => setEditor(null)}
                onSubmit={submitEdit}
                placeholder="Atualize seu comentário…"
                submitLabel="Salvar"
              />
            </div>
          ) : null}
        </div>
      </div>

      {comment.replies.length > 0 ? (
        <div className="mt-5 ml-5 grid gap-5 sm:ml-10">
          {comment.replies.map((reply) => (
            <CommentCard
              comment={reply}
              isPending={isPending}
              isReply
              key={reply.id}
              onDelete={onDelete}
              onEdit={onEdit}
              onReply={onReply}
              requestAuthentication={requestAuthentication}
              viewer={viewer}
            />
          ))}
        </div>
      ) : null}

      <Dialog onOpenChange={setDeleteDialogOpen} open={deleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir comentário?</DialogTitle>
            <DialogDescription>
              Essa ação remove o conteúdo da conversa. As respostas existentes serão preservadas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button disabled={isPending} variant="secondary">
                Cancelar
              </Button>
            </DialogClose>
            <Button disabled={isPending} onClick={() => void confirmDelete()} variant="danger">
              <Trash2 aria-hidden="true" />
              {isPending ? 'Excluindo…' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </article>
  );
}
