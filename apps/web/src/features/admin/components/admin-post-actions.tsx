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
import { Archive, Globe2, RotateCcw, Undo2 } from 'lucide-react';
import { useCallback, useRef, useState, useTransition } from 'react';

import {
  ActionFeedback,
  type ActionFeedbackMessage,
} from '@web/components/feedback/action-feedback';
import { LoadingSpinner } from '@web/components/feedback/loading-spinner';

import { transitionAdminPostAction } from '../actions/admin-post.actions';
import type { AdminPostStatus, AdminPostTransition } from '../types/admin-post.types';

interface AdminPostActionsProps {
  className?: string;
  compact?: boolean;
  disabled?: boolean;
  initialStatus: AdminPostStatus;
  onStatusChange?: (status: AdminPostStatus) => void;
  postId: string;
  title: string;
}

interface TransitionPresentation {
  confirmLabel: string;
  description: string;
  label: string;
  transition: AdminPostTransition;
  variant: 'danger' | 'primary' | 'secondary';
}

interface StatusOverride {
  base: AdminPostStatus;
  value: AdminPostStatus;
}

function availableTransitions(status: AdminPostStatus): TransitionPresentation[] {
  switch (status) {
    case 'DRAFT':
      return [
        {
          confirmLabel: 'Publicar agora',
          description: 'O artigo ficará disponível para todos os leitores.',
          label: 'Publicar',
          transition: 'publish',
          variant: 'primary',
        },
        {
          confirmLabel: 'Arquivar',
          description: 'O rascunho deixará o fluxo de edição até ser restaurado.',
          label: 'Arquivar',
          transition: 'archive',
          variant: 'danger',
        },
      ];
    case 'PUBLISHED':
      return [
        {
          confirmLabel: 'Despublicar',
          description: 'O artigo deixará de aparecer no site e voltará aos rascunhos.',
          label: 'Despublicar',
          transition: 'unpublish',
          variant: 'secondary',
        },
        {
          confirmLabel: 'Arquivar',
          description: 'O artigo deixará de aparecer no site e será retirado do fluxo de edição.',
          label: 'Arquivar',
          transition: 'archive',
          variant: 'danger',
        },
      ];
    case 'ARCHIVED':
      return [
        {
          confirmLabel: 'Restaurar rascunho',
          description: 'O artigo voltará aos rascunhos e poderá ser editado novamente.',
          label: 'Restaurar',
          transition: 'restore',
          variant: 'secondary',
        },
      ];
  }
}

function TransitionIcon({ transition }: Readonly<{ transition: AdminPostTransition }>) {
  if (transition === 'publish') return <Globe2 aria-hidden="true" />;
  if (transition === 'unpublish') return <Undo2 aria-hidden="true" />;
  if (transition === 'restore') return <RotateCcw aria-hidden="true" />;
  return <Archive aria-hidden="true" />;
}

export function AdminPostActions({
  className,
  compact = false,
  disabled = false,
  initialStatus,
  onStatusChange,
  postId,
  title,
}: Readonly<AdminPostActionsProps>) {
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
      const result = await transitionAdminPostAction(postId, selected.transition);
      feedbackId.current += 1;

      if (!result.ok) {
        setSelected(null);
        setFeedback({ id: feedbackId.current, message: result.message, tone: 'error' });
        return;
      }

      setStatusOverride({ base: initialStatus, value: result.data.status });
      onStatusChange?.(result.data.status);
      setSelected(null);
      setFeedback({ id: feedbackId.current, message: result.message, tone: 'success' });
    });
  }

  return (
    <>
      <div className={cn('flex flex-wrap items-center gap-2', className)}>
        {availableTransitions(status).map((item) => (
          <Button
            aria-label={item.label}
            disabled={disabled || isPending}
            key={item.transition}
            onClick={() => setSelected(item)}
            size={compact ? 'icon' : 'small'}
            variant={item.variant}
          >
            {isPending && selected?.transition === item.transition ? (
              <LoadingSpinner />
            ) : (
              <TransitionIcon transition={item.transition} />
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
