import type { Metadata } from 'next';
import { EditorShell } from '@web/components/layout/editor-shell';
import { AdminDraftProvider, AdminEditorHeader } from '@web/features/admin';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: 'Administração',
};

export default function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <AdminDraftProvider>
      <EditorShell header={<AdminEditorHeader />}>{children}</EditorShell>
    </AdminDraftProvider>
  );
}
