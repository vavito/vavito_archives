import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';

import { cn } from '../../lib/cn';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    defaultVariants: {
      size: 'default',
      variant: 'primary',
    },
    variants: {
      size: {
        default: 'min-h-10 px-[18px] py-2.5 text-sm',
        icon: 'size-10 p-0',
        large: 'min-h-11 px-5 py-3 text-sm',
        small: 'min-h-9 px-4 py-2 text-xs',
      },
      variant: {
        danger:
          'border border-destructive-border bg-transparent text-destructive hover:bg-destructive-hover',
        ghost:
          'border border-transparent bg-transparent text-neutral-300 hover:bg-surface-raised hover:text-neutral-100',
        primary: 'border border-accent bg-accent text-background hover:bg-accent/90',
        secondary:
          'border border-border bg-transparent text-neutral-200 hover:border-border-hover hover:text-neutral-100',
      },
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, size, type = 'button', variant, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ className, size, variant }))}
      type={type}
      {...props}
    />
  ),
);

Button.displayName = 'Button';
