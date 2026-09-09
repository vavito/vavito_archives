import type { ReactNode } from 'react';

interface EditorShellProps {
  children: ReactNode;
  header: ReactNode;
}

export function EditorShell({ children, header }: Readonly<EditorShellProps>) {
  return (
    <div className="flex min-h-screen flex-col">
      {header}
      <main className="flex flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-editor flex-1 flex-col px-4 py-10 sm:px-6">
          {children}
        </div>
      </main>
    </div>
  );
}
