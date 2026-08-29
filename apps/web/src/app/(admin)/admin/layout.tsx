import { EditorShell } from '@web/components/layout/editor-shell';
import type { ReactNode } from 'react';

export default function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <EditorShell>{children}</EditorShell>;
}
