import type { ReactNode } from 'react';

import { RouteMotion } from '../feedback/route-motion';

interface EditorShellProps {
  children: ReactNode;
  header: ReactNode;
}

export function EditorShell({ children, header }: Readonly<EditorShellProps>) {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        className="bg-accent text-background fixed top-3 left-3 z-[60] -translate-y-20 rounded-md px-4 py-2 text-sm font-medium transition-transform focus:translate-y-0"
        href="#main-content"
      >
        Pular para o editor
      </a>
      {header}
      <main className="flex flex-1 flex-col" id="main-content">
        <RouteMotion className="mx-auto max-w-editor px-4 py-10 sm:px-6">{children}</RouteMotion>
      </main>
    </div>
  );
}
