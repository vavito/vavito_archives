import type { Metadata } from 'next';
import { PageError } from '@web/components/feedback/page-error';
import { AdminCampaignsPanel } from '@web/features/admin/components/admin-campaigns-panel';
import { AdminNavigation } from '@web/features/admin/components/admin-navigation';
import { adminPageNumber } from '@web/features/admin/schemas/admin-community.schema';
import { listAdminCampaigns } from '@web/features/admin/services/admin-campaigns.service';
import { requireAdminSession } from '@web/features/admin/services/admin-session.service';
import type { AdminCampaign } from '@web/features/admin/types/admin-community.types';
import { createWebAuthenticatedApiClient } from '@web/lib/api/api-client';

export const metadata: Metadata = { title: 'Newsletter | Administração' };

export default async function AdminCampaignsPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ page?: string; status?: string }> }>) {
  const [params, session] = await Promise.all([searchParams, requireAdminSession()]);
  const status = ['DRAFT', 'SENDING', 'SENT', 'FAILED'].includes(params.status ?? '')
    ? (params.status as AdminCampaign['status'])
    : undefined;
  let data;
  try {
    data = await listAdminCampaigns(
      adminPageNumber(params.page),
      status,
      createWebAuthenticatedApiClient(() => session.accessToken),
    );
  } catch {
    return (
      <>
        <AdminNavigation />
        <PageError
          title="Não foi possível carregar as campanhas."
          description="Tente novamente em alguns instantes."
        />
      </>
    );
  }
  return (
    <>
      <AdminNavigation />
      <AdminCampaignsPanel data={data} {...(status ? { status } : {})} />
    </>
  );
}
