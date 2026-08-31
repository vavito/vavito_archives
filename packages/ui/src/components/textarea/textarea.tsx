'use client';

import { forwardRef, useId, type ReactNode, type TextareaHTMLAttributes } from 'react';

import { cn } from '../../lib/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  description?: ReactNode;
  error?: ReactNode;
  label?: ReactNode;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { 'aria-describedby': ariaDescribedBy, className, description, error, id, label, ...props },
    ref,
  ) => {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    const descriptionId = description ? `${fieldId}-description` : undefined;
    const errorId = error ? `${fieldId}-error` : undefined;
    const describedBy = [ariaDescribedBy, descriptionId, errorId].filter(Boolean).join(' ');

    return (
      <div className="grid gap-2">
        {label ? (
          <label
            className="text-neutral-500 text-[11px] font-medium tracking-[0.16em] uppercase"
            htmlFor={fieldId}
          >
            {label}
          </label>
        ) : null}
        <textarea
          ref={ref}
          aria-describedby={describedBy || undefined}
          aria-invalid={error ? true : undefined}
          className={cn(
            'bg-surface-card text-neutral-100 placeholder:text-neutral-600 min-h-36 w-full resize-y rounded-xl border border-border px-4 py-3 text-base leading-relaxed transition-colors focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none sm:text-sm',
            error &&
              'border-destructive focus-visible:border-destructive focus-visible:ring-destructive',
            className,
          )}
          id={fieldId}
          {...props}
        />
        {description ? (
          <p className="text-neutral-500 text-xs leading-relaxed" id={descriptionId}>
            {description}
          </p>
        ) : null}
        {error ? (
          <p className="text-destructive text-xs leading-relaxed" id={errorId} role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
