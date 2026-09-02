'use client';

import { cn } from '@vavito/ui';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

interface RouteMotionProps {
  children: ReactNode;
  className?: string | undefined;
}

export function RouteMotion({ children, className }: Readonly<RouteMotionProps>) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        'page-route-enter page-content-sequence flex w-full flex-1 flex-col',
        className,
      )}
      data-route-motion={pathname}
      key={pathname}
    >
      {children}
    </div>
  );
}
