import { cn } from '@vavito/ui';
import type { ReactNode } from 'react';

import { MobileNavigation } from '../navigation/mobile-navigation';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

interface SiteShellProps {
  children: ReactNode;
  contentClassName?: string;
}

export function SiteShell({ children, contentClassName }: Readonly<SiteShellProps>) {
  return (
    <div className="flex min-h-screen flex-col pb-[calc(4rem+max(0.5rem,env(safe-area-inset-bottom)))] md:pb-0">
      <a
        className="bg-accent text-background fixed top-3 left-3 z-[60] -translate-y-20 rounded-md px-4 py-2 text-sm font-medium transition-transform focus:translate-y-0"
        href="#main-content"
      >
        Pular para o conteúdo
      </a>
      <SiteHeader />
      <main className={cn('flex flex-1 flex-col', contentClassName)} id="main-content">
        {children}
      </main>
      <SiteFooter />
      <MobileNavigation />
    </div>
  );
}
