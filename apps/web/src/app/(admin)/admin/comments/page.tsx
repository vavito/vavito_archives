import type { Metadata } from 'next';
import { PageError } from '@web/components/feedback/page-error';
import { AdminCommentsPanel } from '@web/features/admin/components/admin-comments-panel';
import { adminPageNumber } from '@web/features/admin/schemas/admin-community.schema';
import { listAdminComments } from '@web/features/admin/services/admin-comments.service';
import { requireAdminSession } from '@web/features/admin/services/admin-session.service';
import type { AdminComment } from '@web/features/admin/types/admin-community.types';
import { createWebAuthenticatedApiClient } from '@web/lib/api/api-client';

export const metadata: Metadata = { title: 'Comentários | Administração' };

export default async function AdminCommentsPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ page?: string; status?: string }> }>) {
  const [params, session] = await Promise.all([searchParams, requireAdminSession()]);
  const status = ['VISIBLE', 'HIDDEN', 'SPAM', 'DELETED'].includes(params.status ?? '')
    ? (params.status as AdminComment['status'])
    : undefined;
  let data;
  try {
    data = await listAdminComments(
      adminPageNumber(params.page),
      status,
      createWebAuthenticatedApiClient(() => session.accessToken),
    );
  } catch {
    return (
      <PageError
        title="Não foi possível carregar os comentários."
        description="Tente novamente em alguns instantes."
      />
    );
  }
  return <AdminCommentsPanel data={data} {...(status ? { status } : {})} />;
}
