import { buttonVariants, cn } from '@vavito/ui';
import { Search } from 'lucide-react';
import Link from 'next/link';

import { SiteNavigation } from '../navigation/site-navigation';

export function SiteHeader() {
  return (
    <header className="bg-background/90 sticky top-0 z-40 border-b border-divider backdrop-blur">
      <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center gap-5 px-4 sm:px-6 lg:px-8">
        <Link
          aria-label="Vavito Archives — início"
          className="flex shrink-0 items-center gap-2 text-neutral-100"
          href="/"
        >
          <span
            aria-hidden="true"
            className="bg-accent text-background grid size-6 place-items-center rounded-md font-mono text-xs font-bold"
          >
            v
          </span>
          <span className="text-sm font-semibold tracking-tight sm:text-base">vavito archives</span>
        </Link>

        <div className="ml-auto flex items-center gap-2 md:gap-6">
          <SiteNavigation />
          <button
            aria-label="Buscar artigos"
            className="text-neutral-400 hover:bg-surface-raised hover:text-neutral-100 flex min-h-10 items-center gap-2 rounded-full border border-border px-3 text-sm transition-colors md:min-w-44 md:justify-between"
            type="button"
          >
            <span className="flex items-center gap-2">
              <Search aria-hidden="true" className="size-4" />
              <span className="hidden md:inline">Buscar</span>
            </span>
            <kbd className="text-neutral-600 hidden font-mono text-[10px] md:inline">⌘ K</kbd>
          </button>
          <Link
            className={cn(buttonVariants({ size: 'small' }), 'hidden sm:inline-flex')}
            href="/auth"
          >
            Entrar
          </Link>
        </div>
      </div>
    </header>
  );
}
