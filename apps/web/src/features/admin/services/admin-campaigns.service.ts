import type { ApiClient } from '@vavito/api-client';
import type {
  AdminCampaign,
  AdminCampaignsPage,
  CreateAdminCampaign,
  EditAdminCampaign,
} from '../types/admin-community.types';

export async function listAdminCampaigns(
  page: number,
  status: AdminCampaign['status'] | undefined,
  client: ApiClient,
): Promise<AdminCampaignsPage> {
  const response = await client.GET('/api/v1/admin/newsletter/campaigns', {
    params: { query: { page, limit: 20, ...(status ? { status } : {}) } },
  });
  if (!response.data) throw new Error('Missing campaigns response');
  return response.data;
}

export async function getAdminCampaign(id: string, client: ApiClient): Promise<AdminCampaign> {
  const response = await client.GET('/api/v1/admin/newsletter/campaigns/{id}', {
    params: { path: { id } },
  });
  if (!response.data) throw new Error('Missing campaign response');
  return response.data;
}

export async function createAdminCampaign(
  body: CreateAdminCampaign,
  client: ApiClient,
): Promise<AdminCampaign> {
  const response = await client.POST('/api/v1/admin/newsletter/campaigns', { body });
  if (!response.data) throw new Error('Missing campaign response');
  return response.data;
}

export async function editAdminCampaign(
  id: string,
  body: EditAdminCampaign,
  client: ApiClient,
): Promise<AdminCampaign> {
  const response = await client.PATCH('/api/v1/admin/newsletter/campaigns/{id}', {
    params: { path: { id } },
    body,
  });
  if (!response.data) throw new Error('Missing campaign response');
  return response.data;
}

export async function sendAdminCampaign(
  id: string,
  idempotencyKey: string,
  client: ApiClient,
): Promise<AdminCampaign> {
  const response = await client.POST('/api/v1/admin/newsletter/campaigns/{id}/send', {
    params: { path: { id }, header: { 'Idempotency-Key': idempotencyKey } },
  });
  if (!response.data) throw new Error('Missing campaign response');
  return response.data;
}
