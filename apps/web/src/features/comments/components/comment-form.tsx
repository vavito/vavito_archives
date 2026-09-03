'use client';

import { Button, Textarea } from '@vavito/ui';
import { Send } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { LoadingSpinner } from '@web/components/feedback/loading-spinner';

import {
  COMMENT_LIMITS,
  normalizeCommentContent,
  validateCommentContent,
} from '../schemas/comment.schema';

interface CommentFormProps {
  autoFocus?: boolean;
  initialContent?: string;
  isPending: boolean;
  label: string;
  onCancel?: () => void;
  onSubmit: (content: string) => Promise<boolean>;
  placeholder: string;
  submitLabel: string;
}

export function CommentForm({
  autoFocus = false,
  initialContent = '',
  isPending,
  label,
  onCancel,
  onSubmit,
  placeholder,
  submitLabel,
}: Readonly<CommentFormProps>) {
  const [content, setContent] = useState(initialContent);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validateCommentContent(content);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    const succeeded = await onSubmit(normalizeCommentContent(content));
    if (succeeded) setContent('');
  }

  return (
    <form className="grid gap-3" noValidate onSubmit={(event) => void handleSubmit(event)}>
      <Textarea
        autoFocus={autoFocus}
        className="min-h-28"
        disabled={isPending}
        error={error}
        label={label}
        maxLength={COMMENT_LIMITS.content}
        onChange={(event) => {
          setContent(event.target.value);
          if (error) setError(null);
        }}
        placeholder={placeholder}
        value={content}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-neutral-600 font-mono text-[11px]">
          {content.length.toLocaleString('pt-BR')}/{COMMENT_LIMITS.content.toLocaleString('pt-BR')}
        </span>
        <div className="flex items-center gap-2">
          {onCancel ? (
            <Button disabled={isPending} onClick={onCancel} size="small" variant="ghost">
              Cancelar
            </Button>
          ) : null}
          <Button disabled={isPending} size="small" type="submit">
            {isPending ? <LoadingSpinner /> : <Send aria-hidden="true" />}
            {isPending ? 'Aguarde…' : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
