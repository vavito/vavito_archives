import type { components } from '@vavito/api-client';

export type AdminComment = components['schemas']['CommentAdminResponseDto'];
export type AdminCommentsPage = components['schemas']['PaginatedAdminCommentsResponseDto'];
export type ModerationStatus = components['schemas']['CommentModerationStatus'];
export type AdminCampaign = components['schemas']['EmailCampaignAdminDto'];
export type AdminCampaignsPage = components['schemas']['PaginatedEmailCampaignsDto'];
export type CreateAdminCampaign = components['schemas']['CreateCampaignDto'];
export type EditAdminCampaign = Required<
  Pick<components['schemas']['UpdateCampaignDto'], 'subject' | 'previewText'>
>;
export type AdminActionResult<T> =
  { ok: true; data: T; message: string } | { ok: false; message: string };

export const commentStatusLabels: Record<AdminComment['status'], string> = {
  VISIBLE: 'Visível',
  HIDDEN: 'Oculto',
  SPAM: 'Spam',
  DELETED: 'Excluído',
};
export const campaignStatusLabels: Record<AdminCampaign['status'], string> = {
  DRAFT: 'Rascunho',
  SENDING: 'Enviando',
  SENT: 'Envio aceito',
  FAILED: 'Falha no envio',
};
