import { randomUUID } from 'node:crypto';
import { ApiClientError } from '@vavito/api-client';
import { notFound } from 'next/navigation';
import { PageError } from '@web/components/feedback/page-error';
import { AdminCampaignDetail } from '@web/features/admin/components/admin-campaign-detail';
import { isAdminResourceId } from '@web/features/admin/schemas/admin-community.schema';
import { getAdminCampaign } from '@web/features/admin/services/admin-campaigns.service';
import { requireAdminSession } from '@web/features/admin/services/admin-session.service';
import { createWebAuthenticatedApiClient } from '@web/lib/api/api-client';

export default async function CampaignPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const [{ id }, session] = await Promise.all([params, requireAdminSession()]);
  if (!isAdminResourceId(id)) notFound();
  let campaign;
  try {
    campaign = await getAdminCampaign(
      id,
      createWebAuthenticatedApiClient(() => session.accessToken),
    );
  } catch (error) {
    if (error instanceof ApiClientError && error.statusCode === 404) notFound();
    return (
      <PageError
        title="Não foi possível carregar a campanha."
        description="Tente novamente em alguns instantes."
      />
    );
  }
  return (
    <AdminCampaignDetail
      campaign={campaign}
      attemptKey={
        typeof campaign.idempotencyKey === 'string' ? campaign.idempotencyKey : randomUUID()
      }
      key={id}
    />
  );
}
