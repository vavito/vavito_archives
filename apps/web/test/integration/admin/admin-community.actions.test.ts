import { ApiClientError } from '@vavito/api-client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createCampaignAction,
  editCampaignAction,
  refreshCampaignAction,
  sendCampaignAction,
} from '@web/features/admin/actions/admin-campaign.actions';
import { moderateCommentAction } from '@web/features/admin/actions/admin-comment.actions';

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  client: vi.fn(),
  revalidate: vi.fn(),
  create: vi.fn(),
  edit: vi.fn(),
  get: vi.fn(),
  send: vi.fn(),
  moderate: vi.fn(),
}));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidate }));
vi.mock('@web/lib/api/api-client', () => ({ createWebAuthenticatedApiClient: mocks.client }));
vi.mock('@web/features/admin/services/admin-session.service', () => ({
  requireAdminSession: mocks.session,
}));
vi.mock('@web/features/admin/services/admin-comments.service', () => ({
  moderateAdminComment: mocks.moderate,
}));
vi.mock('@web/features/admin/services/admin-campaigns.service', () => ({
  createAdminCampaign: mocks.create,
  editAdminCampaign: mocks.edit,
  getAdminCampaign: mocks.get,
  sendAdminCampaign: mocks.send,
}));

const id = '019c2d62-6e90-7000-8000-000000000010';
const key = '019c2d62-6e90-7000-8000-000000000051';
function apiError(code: string, statusCode = 409) {
  return new ApiClientError({
    code,
    statusCode,
    message: 'Technical provider detail',
    details: null,
    path: null,
    requestId: null,
    timestamp: null,
  });
}

describe('ações administrativas de comunidade', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.session.mockResolvedValue({ accessToken: 'session' });
    mocks.client.mockReturnValue('client');
    mocks.create.mockResolvedValue({ id, status: 'DRAFT' });
    mocks.edit.mockResolvedValue({ id, status: 'DRAFT' });
    mocks.send.mockResolvedValue({ id, status: 'SENT' });
    mocks.get.mockResolvedValue({ id, status: 'SENT' });
    mocks.moderate.mockResolvedValue({ id, status: 'HIDDEN' });
  });

  it('exige sessão administrativa em todas as ações, inclusive consulta de estado', async () => {
    mocks.session.mockRejectedValue(new Error('Forbidden'));
    for (const action of [
      () => createCampaignAction({ postIds: [id], subject: 'Artigo', previewText: '' }),
      () => editCampaignAction(id, { subject: 'Artigo', previewText: '' }),
      () => sendCampaignAction(id, key),
      () => refreshCampaignAction(id),
      () => moderateCommentAction(id, 'VISIBLE', ''),
    ])
      await expect(action()).rejects.toThrow('Forbidden');
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.edit).not.toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.get).not.toHaveBeenCalled();
    expect(mocks.moderate).not.toHaveBeenCalled();
  });

  it('rejeita referência inválida, assunto vazio e motivo longo antes de alterar dados', async () => {
    expect((await sendCampaignAction(id, 'invalid')).ok).toBe(false);
    expect((await createCampaignAction({ postIds: [id], subject: '  ' })).ok).toBe(false);
    expect((await moderateCommentAction(id, 'HIDDEN', 'x'.repeat(501))).ok).toBe(false);
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.moderate).not.toHaveBeenCalled();
  });

  it('modera e revalida a fila e as conversas públicas', async () => {
    expect((await moderateCommentAction(id, 'HIDDEN', 'Fora do tema')).ok).toBe(true);
    expect(mocks.moderate).toHaveBeenCalledWith(id, 'HIDDEN', 'Fora do tema', 'client');
    expect(mocks.revalidate).toHaveBeenCalledWith('/admin/comments');
    expect(mocks.revalidate).toHaveBeenCalledWith('/artigos/[slug]', 'page');
  });

  it('informa conflito de moderação sem expor detalhes internos', async () => {
    mocks.moderate.mockRejectedValue(apiError('COMMENT_ALREADY_DELETED'));
    expect(await moderateCommentAction(id, 'VISIBLE', '')).toEqual({
      ok: false,
      message: 'Este comentário mudou ou foi excluído. Atualize a lista para continuar.',
    });
  });

  it('cria e edita apenas os campos permitidos e revalida o painel', async () => {
    await createCampaignAction({
      postIds: [id],
      subject: '  Novo artigo  ',
      previewText: 'Leia agora',
    });
    expect(mocks.create).toHaveBeenCalledWith(
      { postIds: [id], subject: 'Novo artigo', previewText: 'Leia agora' },
      'client',
    );
    await editCampaignAction(id, { subject: 'Novo assunto', previewText: '' });
    expect(mocks.edit).toHaveBeenCalledWith(
      id,
      { subject: 'Novo assunto', previewText: '' },
      'client',
    );
    expect(mocks.revalidate).toHaveBeenCalledWith(`/admin/campaigns/${id}`);
  });

  it('reutiliza a chave de envio recebida e espera pelo processamento', async () => {
    await sendCampaignAction(id, key);
    await sendCampaignAction(id, key);
    expect(mocks.send).toHaveBeenNthCalledWith(1, id, key, 'client');
    expect(mocks.send).toHaveBeenNthCalledWith(2, id, key, 'client');
    expect(mocks.client).toHaveBeenCalledWith(expect.any(Function), 60_000);
  });

  it.each([
    ['CAMPAIGN_AUDIENCE_EMPTY', 'assinantes confirmados'],
    ['CAMPAIGN_POST_NOT_PUBLISHED', 'Publique o artigo'],
    ['CAMPAIGN_ALREADY_SENT', 'já foi enviada'],
    ['CAMPAIGN_SEND_IN_PROGRESS', 'em andamento'],
    ['CAMPAIGN_PROVIDER_REJECTED', 'não serão reenviados'],
  ])('traduz %s em uma orientação amigável', async (code, message) => {
    mocks.send.mockRejectedValue(apiError(code));
    const result = await sendCampaignAction(id, key);
    expect(result.ok).toBe(false);
    expect(result.message).toContain(message);
  });

  it('não declara falha definitiva nem refaz envio após timeout', async () => {
    mocks.send.mockRejectedValue(ApiClientError.timeout(new Error('timeout')));
    const result = await sendCampaignAction(id, key);
    expect(result.ok).toBe(false);
    expect(result.message).toContain('confirmar o resultado');
    expect(mocks.send).toHaveBeenCalledTimes(1);
    expect(mocks.revalidate).toHaveBeenCalledWith(`/admin/campaigns/${id}`);
  });
});
