import { buttonVariants, cn } from '@vavito/ui';
import Link from 'next/link';

import { SearchOverlay } from '@web/features/posts';

import { SiteNavigation } from '../navigation/site-navigation';

export function SiteHeader() {
  return (
    <header className="site-header-enter bg-background/90 sticky top-0 z-40 border-b border-divider backdrop-blur">
      <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center gap-5 px-4 sm:px-6 lg:px-8">
        <Link
          aria-label="Vavito Archives — início"
          className="group flex shrink-0 items-center gap-2 text-neutral-100"
          href="/"
        >
          <span
            aria-hidden="true"
            className="bg-accent text-background grid size-6 place-items-center rounded-md font-mono text-xs font-bold transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110"
          >
            v
          </span>
          <span className="text-sm font-semibold tracking-tight sm:text-base">vavito archives</span>
        </Link>

        <div className="ml-auto flex items-center gap-2 md:gap-6">
          <SiteNavigation />
          <SearchOverlay />
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
