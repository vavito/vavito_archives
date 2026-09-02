import { Button } from '@vavito/ui';
import { ArrowLeft, Eye, Save } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { RouteMotion } from '../feedback/route-motion';

export function EditorShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        className="bg-accent text-background fixed top-3 left-3 z-[60] -translate-y-20 rounded-md px-4 py-2 text-sm font-medium transition-transform focus:translate-y-0"
        href="#main-content"
      >
        Pular para o editor
      </a>
      <header className="site-header-enter bg-background/90 sticky top-0 z-40 border-b border-divider backdrop-blur">
        <div className="mx-auto flex min-h-16 w-full items-center gap-3 px-4 sm:px-6">
          <Link
            aria-label="Voltar ao site"
            className="text-neutral-400 hover:bg-surface-raised hover:text-neutral-100 grid size-10 place-items-center rounded-full transition-colors"
            href="/"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
          </Link>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-neutral-200">Novo artigo</p>
            <p className="text-neutral-500 text-xs">Rascunho salvo</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button aria-label="Visualizar artigo" size="icon" variant="ghost">
              <Eye aria-hidden="true" />
            </Button>
            <Button size="small" variant="secondary">
              <Save aria-hidden="true" />
              <span className="hidden sm:inline">Salvar</span>
            </Button>
            <Button size="small">Publicar</Button>
          </div>
        </div>
      </header>
      <main className="flex flex-1 flex-col" id="main-content">
        <RouteMotion className="mx-auto max-w-editor px-4 py-10 sm:px-6">{children}</RouteMotion>
      </main>
    </div>
  );
}
