'use client';

import { cn, Input, type InputProps } from '@vavito/ui';
import { Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { useState } from 'react';

interface PasswordFieldProps extends Omit<InputProps, 'label' | 'type'> {
  label: string;
}

export function PasswordField({ className, disabled, label, ...props }: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);
  const actionLabel = `${isVisible ? 'Ocultar' : 'Mostrar'} conteúdo do campo ${label}`;

  return (
    <div className="group relative">
      <LockKeyhole
        aria-hidden="true"
        className="text-neutral-500 absolute top-10 left-4 z-10 size-4 transition-[color,transform] duration-200 group-focus-within:scale-110 group-focus-within:text-accent motion-reduce:transform-none"
      />
      <Input
        {...props}
        className={cn('pr-12 pl-11', className)}
        disabled={disabled}
        label={label}
        type={isVisible ? 'text' : 'password'}
      />
      <button
        aria-label={actionLabel}
        aria-pressed={isVisible}
        className="text-neutral-500 hover:bg-surface-raised hover:text-neutral-100 absolute top-7 right-1.5 inline-flex size-10 items-center justify-center rounded-lg transition-[color,background-color,transform] duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none motion-reduce:transform-none"
        disabled={disabled}
        onClick={() => setIsVisible((current) => !current)}
        onMouseDown={(event) => event.preventDefault()}
        title={isVisible ? 'Ocultar senha' : 'Mostrar senha'}
        type="button"
      >
        {isVisible ? (
          <EyeOff key="hidden" aria-hidden="true" className="auth-icon-swap size-4" />
        ) : (
          <Eye key="visible" aria-hidden="true" className="auth-icon-swap size-4" />
        )}
      </button>
    </div>
  );
}
