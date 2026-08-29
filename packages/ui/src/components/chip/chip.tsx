import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';

import { cn } from '../../lib/cn';

const chipVariants = cva(
  'inline-flex min-h-8 items-center justify-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0',
  {
    defaultVariants: {
      active: false,
    },
    variants: {
      active: {
        false:
          'border-border bg-transparent text-neutral-300 hover:border-border-hover hover:text-neutral-100',
        true: 'border-accent bg-accent-soft text-accent hover:bg-accent-soft',
      },
    },
  },
);

export interface ChipProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof chipVariants> {}

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(
  ({ active = false, className, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      aria-pressed={active ?? false}
      className={cn(chipVariants({ active, className }))}
      type={type}
      {...props}
    />
  ),
);

Chip.displayName = 'Chip';
