import { EditorShell } from '@web/components/layout/editor-shell';
import { AdminDraftProvider, AdminDraftWorkspace, AdminEditorHeader } from '@web/features/admin';

interface AdminPageProps {
  searchParams: Promise<{ new?: string | string[]; post?: string | string[] }>;
}

function firstParameter(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function validPostId(value: string | undefined): string | null {
  return value && /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(value) ? value : null;
}

export default async function AdminPage({ searchParams }: Readonly<AdminPageProps>) {
  const parameters = await searchParams;
  const postId = validPostId(firstParameter(parameters.post));
  const startNew = firstParameter(parameters.new) === '1';

  return (
    <AdminDraftProvider initialPostId={postId} startNew={startNew}>
      <EditorShell header={<AdminEditorHeader />}>
        <AdminDraftWorkspace />
      </EditorShell>
    </AdminDraftProvider>
  );
}
