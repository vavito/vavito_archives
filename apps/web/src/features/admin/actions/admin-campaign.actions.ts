'use server';

import { ApiClientError } from '@vavito/api-client';
import { revalidatePath } from 'next/cache';
import { createWebAuthenticatedApiClient } from '@web/lib/api/api-client';
import { isAdminResourceId, isCampaignText } from '../schemas/admin-community.schema';
import {
  createAdminCampaign,
  editAdminCampaign,
  getAdminCampaign,
  sendAdminCampaign,
} from '../services/admin-campaigns.service';
import { requireAdminSession } from '../services/admin-session.service';
import type {
  AdminActionResult,
  AdminCampaign,
  CreateAdminCampaign,
  EditAdminCampaign,
} from '../types/admin-community.types';

function campaignError(error: unknown, sending = false): AdminActionResult<AdminCampaign> {
  const messages: Record<string, string> = {
    CAMPAIGN_POST_NOT_PUBLISHED: 'Publique o artigo antes de criar ou enviar a campanha.',
    CAMPAIGN_AUDIENCE_EMPTY: 'Ainda não há assinantes confirmados para receber esta campanha.',
    CAMPAIGN_ALREADY_SENT: 'Esta campanha já foi enviada. Atualize o estado para conferir.',
    CAMPAIGN_SEND_IN_PROGRESS: 'O envio já está em andamento. Atualize o estado para acompanhar.',
    INVALID_CAMPAIGN_STATUS_TRANSITION:
      'Esta campanha não está mais em rascunho. Atualize o estado.',
    CAMPAIGN_PROVIDER_REJECTED:
      'Não foi possível concluir o envio. Atualize o estado; os emails já aceitos não serão reenviados.',
    CAMPAIGN_CONTENT_INVALID: 'Revise o assunto e o conteúdo da campanha.',
    CAMPAIGN_IDEMPOTENCY_CONFLICT:
      'Esta tentativa já está associada a outra campanha. Atualize a página.',
  };
  return {
    ok: false,
    message:
      (error instanceof ApiClientError && messages[error.code]) ||
      (sending
        ? 'Ainda não conseguimos confirmar o resultado do envio. Atualize o estado antes de tentar novamente.'
        : 'Não foi possível salvar a campanha agora. Tente novamente.'),
  };
}

function refreshCampaign(id?: string) {
  revalidatePath('/admin/campaigns');
  if (id) revalidatePath(`/admin/campaigns/${id}`);
}

export async function createCampaignAction(
  input: CreateAdminCampaign,
): Promise<AdminActionResult<AdminCampaign>> {
  const session = await requireAdminSession();
  if (
    !input ||
    !Array.isArray(input.postIds) ||
    input.postIds.length < 1 ||
    input.postIds.length > 5 ||
    input.postIds.some((postId) => !isAdminResourceId(postId)) ||
    !isCampaignText(input.subject, input.previewText ?? '')
  ) {
    return {
      ok: false,
      message: 'Escolha um artigo publicado e preencha um assunto de até 255 caracteres.',
    };
  }
  try {
    const data = await createAdminCampaign(
      {
        postIds: input.postIds,
        subject: input.subject.trim(),
        previewText: input.previewText ?? '',
      },
      createWebAuthenticatedApiClient(() => session.accessToken),
    );
    refreshCampaign();
    return { ok: true, data, message: 'Rascunho de campanha criado.' };
  } catch (error) {
    return campaignError(error);
  }
}

export async function editCampaignAction(
  id: string,
  input: EditAdminCampaign,
): Promise<AdminActionResult<AdminCampaign>> {
  const session = await requireAdminSession();
  if (!isAdminResourceId(id) || !input || !isCampaignText(input.subject, input.previewText)) {
    return {
      ok: false,
      message: 'Preencha o assunto e respeite o limite de 255 caracteres por campo.',
    };
  }
  try {
    const data = await editAdminCampaign(
      id,
      { subject: input.subject.trim(), previewText: input.previewText },
      createWebAuthenticatedApiClient(() => session.accessToken),
    );
    refreshCampaign(id);
    return { ok: true, data, message: 'Campanha salva. Confira o preview antes de enviar.' };
  } catch (error) {
    refreshCampaign(id);
    return campaignError(error);
  }
}

export async function sendCampaignAction(
  id: string,
  key: string,
): Promise<AdminActionResult<AdminCampaign>> {
  const session = await requireAdminSession();
  if (!isAdminResourceId(id) || !isAdminResourceId(key))
    return { ok: false, message: 'Tentativa inválida. Atualize a página.' };
  try {
    const data = await sendAdminCampaign(
      id,
      key,
      createWebAuthenticatedApiClient(() => session.accessToken, 60_000),
    );
    refreshCampaign(id);
    return {
      ok: true,
      data,
      message:
        data.status === 'SENT'
          ? 'Envio aceito. A entrega pode levar alguns instantes.'
          : 'Envio em andamento. Atualize o estado para acompanhar.',
    };
  } catch (error) {
    refreshCampaign(id);
    return campaignError(error, true);
  }
}

export async function refreshCampaignAction(id: string): Promise<AdminActionResult<AdminCampaign>> {
  const session = await requireAdminSession();
  if (!isAdminResourceId(id)) return { ok: false, message: 'Campanha inválida.' };
  try {
    const data = await getAdminCampaign(
      id,
      createWebAuthenticatedApiClient(() => session.accessToken),
    );
    return { ok: true, data, message: 'Estado atualizado.' };
  } catch {
    return { ok: false, message: 'Não foi possível consultar o estado agora. Tente novamente.' };
  }
}
