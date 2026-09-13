'use client';

import {
  Button,
  cn,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@vavito/ui';
import { Archive, Globe2, RotateCcw, Trash2, Undo2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState, useTransition } from 'react';

import {
  ActionFeedback,
  type ActionFeedbackMessage,
} from '@web/components/feedback/action-feedback';
import { LoadingSpinner } from '@web/components/feedback/loading-spinner';

import {
  deleteAdminPostAction,
  discardAdminPostChangesAction,
  transitionAdminPostAction,
} from '../actions/admin-post.actions';
import type { AdminPostStatus, AdminPostTransition } from '../types/admin-post.types';

interface AdminPostActionsProps {
  allowDelete?: boolean;
  className?: string;
  compact?: boolean;
  disabled?: boolean;
  editor?: boolean;
  hasPendingChanges?: boolean;
  initialStatus: AdminPostStatus;
  onStatusChange?: (status: AdminPostStatus) => void;
  onPublishedChanges?: () => void;
  onDiscardedChanges?: () => void;
  postId: string;
  slug?: string | null;
  title: string;
}

interface TransitionPresentation {
  action: AdminPostTransition | 'delete' | 'discard';
  confirmLabel: string;
  description: string;
  label: string;
  variant: 'danger' | 'primary' | 'secondary';
}

interface StatusOverride {
  base: AdminPostStatus;
  value: AdminPostStatus;
}

function availableTransitions(
  status: AdminPostStatus,
  allowDelete: boolean,
  editor: boolean,
  hasPendingChanges: boolean,
): TransitionPresentation[] {
  let transitions: TransitionPresentation[];

  switch (status) {
    case 'DRAFT':
      transitions = [
        {
          confirmLabel: 'Publicar agora',
          action: 'publish',
          description: 'O artigo ficará disponível para todos os leitores.',
          label: 'Publicar',
          variant: 'primary',
        },
        {
          confirmLabel: 'Arquivar',
          action: 'archive',
          description: 'O rascunho deixará o fluxo de edição até ser restaurado.',
          label: 'Arquivar',
          variant: 'danger',
        },
      ];
      break;
    case 'PUBLISHED':
      transitions = (
        [
          ...(editor && hasPendingChanges
            ? [
                {
                  confirmLabel: 'Publicar alterações',
                  action: 'publish' as const,
                  description:
                    'As mudanças salvas substituirão a versão disponível para os leitores.',
                  label: 'Publicar alterações',
                  variant: 'primary' as const,
                },
                {
                  action: 'discard' as const,
                  confirmLabel: 'Descartar alterações',
                  description:
                    'As mudanças ainda não publicadas serão removidas e o editor voltará à versão disponível para os leitores.',
                  label: 'Descartar alterações',
                  variant: 'secondary' as const,
                },
              ]
            : []),
          {
            confirmLabel: 'Despublicar',
            action: 'unpublish',
            description: 'O artigo deixará de aparecer no site e voltará aos rascunhos.',
            label: 'Despublicar',
            variant: 'secondary',
          },
          {
            confirmLabel: 'Arquivar',
            action: 'archive',
            description: 'O artigo deixará de aparecer no site e será retirado do fluxo de edição.',
            label: 'Arquivar',
            variant: 'danger',
          },
        ] satisfies TransitionPresentation[]
      ).filter((item) => !(editor && item.action === 'unpublish'));
      break;
    case 'ARCHIVED':
      transitions = [
        {
          confirmLabel: 'Restaurar rascunho',
          action: 'restore',
          description: 'O artigo voltará aos rascunhos e poderá ser editado novamente.',
          label: 'Restaurar',
          variant: 'secondary',
        },
      ];
      break;
  }

  return allowDelete
    ? [
        ...transitions,
        {
          action: 'delete',
          confirmLabel: 'Excluir definitivamente',
          description:
            'Esta ação é permanente. O artigo, seus comentários, reações, salvamentos e histórico editorial serão removidos e não poderão ser recuperados.',
          label: 'Excluir',
          variant: 'danger',
        },
      ]
    : transitions;
}

function TransitionIcon({
  action,
}: Readonly<{ action: AdminPostTransition | 'delete' | 'discard' }>) {
  if (action === 'publish') return <Globe2 aria-hidden="true" />;
  if (action === 'unpublish') return <Undo2 aria-hidden="true" />;
  if (action === 'restore') return <RotateCcw aria-hidden="true" />;
  if (action === 'discard') return <Trash2 aria-hidden="true" />;
  if (action === 'delete') return <Trash2 aria-hidden="true" />;
  return <Archive aria-hidden="true" />;
}

export function AdminPostActions({
  allowDelete = false,
  className,
  compact = false,
  disabled = false,
  editor = false,
  hasPendingChanges = false,
  initialStatus,
  onStatusChange,
  onPublishedChanges,
  onDiscardedChanges,
  postId,
  slug = null,
  title,
}: Readonly<AdminPostActionsProps>) {
  const router = useRouter();
  const [statusOverride, setStatusOverride] = useState<StatusOverride | null>(null);
  const [selected, setSelected] = useState<TransitionPresentation | null>(null);
  const [feedback, setFeedback] = useState<ActionFeedbackMessage | null>(null);
  const [isPending, startTransition] = useTransition();
  const feedbackId = useRef(0);

  const dismissFeedback = useCallback(() => setFeedback(null), []);
  const status = statusOverride?.base === initialStatus ? statusOverride.value : initialStatus;

  function confirmTransition() {
    if (!selected || isPending) return;

    startTransition(async () => {
      if (selected.action === 'delete') {
        const result = await deleteAdminPostAction(postId, slug);
        feedbackId.current += 1;
        setSelected(null);
        setFeedback({
          id: feedbackId.current,
          message: result.message,
          tone: result.ok ? 'success' : 'error',
        });
        if (result.ok) router.refresh();
        return;
      }

      const result =
        selected.action === 'discard'
          ? await discardAdminPostChangesAction(postId)
          : await transitionAdminPostAction(postId, selected.action);
      feedbackId.current += 1;

      if (!result.ok) {
        setSelected(null);
        setFeedback({ id: feedbackId.current, message: result.message, tone: 'error' });
        return;
      }

      setStatusOverride({ base: initialStatus, value: result.data.status });
      onStatusChange?.(result.data.status);
      if (selected.action === 'publish') onPublishedChanges?.();
      if (selected.action === 'discard') onDiscardedChanges?.();
      setSelected(null);
      setFeedback({ id: feedbackId.current, message: result.message, tone: 'success' });
    });
  }

  return (
    <>
      <div className={cn('flex flex-wrap items-center gap-2', className)}>
        {availableTransitions(status, allowDelete, editor, hasPendingChanges).map((item) => (
          <Button
            aria-label={item.label}
            disabled={disabled || isPending}
            key={item.action}
            onClick={() => setSelected(item)}
            size={compact ? 'icon' : 'small'}
            title={compact ? item.label : undefined}
            variant={item.variant}
          >
            {isPending && selected?.action === item.action ? (
              <LoadingSpinner />
            ) : (
              <TransitionIcon action={item.action} />
            )}
            {compact ? <span className="sr-only">{item.label}</span> : item.label}
          </Button>
        ))}
      </div>

      <Dialog onOpenChange={(open) => !open && !isPending && setSelected(null)} open={!!selected}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selected ? `${selected.label} artigo?` : 'Atualizar artigo?'}
            </DialogTitle>
            <DialogDescription>
              {selected?.description}{' '}
              <span className="text-neutral-300">
                {title.trim() ? `“${title.trim()}”` : 'Este artigo'}
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button disabled={isPending} variant="secondary">
                Cancelar
              </Button>
            </DialogClose>
            <Button
              disabled={isPending}
              onClick={confirmTransition}
              variant={selected?.variant ?? 'primary'}
            >
              {isPending ? <LoadingSpinner /> : null}
              {isPending ? 'Atualizando…' : selected?.confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {feedback ? <ActionFeedback feedback={feedback} onDismiss={dismissFeedback} /> : null}
    </>
  );
}
