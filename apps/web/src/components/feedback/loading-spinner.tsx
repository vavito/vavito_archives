import { cn } from '@vavito/ui';
import { LoaderCircle } from 'lucide-react';

interface LoadingSpinnerProps {
  className?: string;
}

export function LoadingSpinner({ className }: Readonly<LoadingSpinnerProps>) {
  return <LoaderCircle aria-hidden="true" className={cn('counterclockwise-spinner', className)} />;
}
