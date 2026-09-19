'use client';

import { Search } from 'lucide-react';
import { lazy, Suspense, useEffect, useState } from 'react';

const SearchOverlayDialog = lazy(() =>
  import('./search-overlay').then(({ SearchOverlay }) => ({ default: SearchOverlay })),
);

export function SearchLauncher() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const openSearch = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener('keydown', openSearch);
    return () => window.removeEventListener('keydown', openSearch);
  }, []);

  return (
    <>
      <button
        aria-label="Buscar artigos"
        className="motion-control text-neutral-400 hover:bg-surface-raised hover:text-neutral-100 flex min-h-10 items-center gap-2 rounded-full border border-border px-3 text-sm md:min-w-44 md:justify-between"
        onClick={() => setOpen(true)}
        type="button"
      >
        <span className="flex items-center gap-2">
          <Search aria-hidden="true" className="size-4" />
          <span className="hidden md:inline">Buscar</span>
        </span>
        <kbd className="text-neutral-600 hidden font-mono text-[10px] md:inline">⌘/Ctrl K</kbd>
      </button>

      {open ? (
        <Suspense fallback={null}>
          <SearchOverlayDialog hideTrigger onOpenChange={setOpen} open />
        </Suspense>
      ) : null}
    </>
  );
}
