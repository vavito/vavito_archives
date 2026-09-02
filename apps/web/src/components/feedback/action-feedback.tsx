'use client';

import { Button, cn } from '@vavito/ui';
import { CheckCircle2, CircleAlert, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export interface ActionFeedbackMessage {
  id: number;
  message: string;
  tone: 'error' | 'success';
}

interface ActionFeedbackProps {
  feedback: ActionFeedbackMessage;
  onDismiss: () => void;
}

const VISIBLE_DURATION_MS = 4_500;
const EXIT_DURATION_MS = 240;

export function ActionFeedback({ feedback, onDismiss }: Readonly<ActionFeedbackProps>) {
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const leaveTimer = window.setTimeout(() => setIsLeaving(true), VISIBLE_DURATION_MS);
    const dismissTimer = window.setTimeout(onDismiss, VISIBLE_DURATION_MS + EXIT_DURATION_MS);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(dismissTimer);
    };
  }, [feedback.id, onDismiss]);

  const Icon = feedback.tone === 'success' ? CheckCircle2 : CircleAlert;

  const card = (
    <div className="fixed top-20 left-1/2 z-[70] w-[calc(100%-2rem)] max-w-md -translate-x-1/2">
      <aside
        aria-live={feedback.tone === 'error' ? 'assertive' : 'polite'}
        className={cn(
          'bg-floating flex items-start gap-3 rounded-xl border p-4 shadow-2xl',
          feedback.tone === 'success'
            ? 'border-accent/35 text-neutral-100'
            : 'border-destructive-border text-neutral-100',
          isLeaving ? 'action-feedback-exit' : 'action-feedback-enter',
        )}
        role={feedback.tone === 'error' ? 'alert' : 'status'}
      >
        <Icon
          aria-hidden="true"
          className={cn(
            'mt-0.5 size-5 shrink-0',
            feedback.tone === 'success' ? 'text-accent' : 'text-destructive',
          )}
        />
        <p className="min-w-0 flex-1 text-sm leading-relaxed">{feedback.message}</p>
        <Button
          aria-label="Fechar aviso"
          className="-mt-2 -mr-2 size-8 min-h-0 p-0"
          onClick={onDismiss}
          size="icon"
          variant="ghost"
        >
          <X aria-hidden="true" />
        </Button>
      </aside>
    </div>
  );

  return typeof document === 'undefined' ? null : createPortal(card, document.body);
}
