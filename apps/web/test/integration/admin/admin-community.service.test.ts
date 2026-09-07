import { createAuthenticatedApiClient } from '@vavito/api-client';
import { describe, expect, it } from 'vitest';
import {
  listAdminComments,
  moderateAdminComment,
} from '@web/features/admin/services/admin-comments.service';
import {
  listAdminCampaigns,
  sendAdminCampaign,
} from '@web/features/admin/services/admin-campaigns.service';

describe('transporte administrativo de comunidade e newsletter', () => {
  it('preserva autenticação e a mesma chave ao repetir uma tentativa de envio', async () => {
    const requests: Request[] = [];
    const client = createAuthenticatedApiClient({
      baseUrl: 'https://example.test',
      getAccessToken: () => 'session-token',
      fetch: (request) => {
        requests.push(request);
        return Promise.resolve(Response.json({ id: 'campaign', status: 'SENDING' }));
      },
    });
    await sendAdminCampaign('campaign', 'same-attempt', client);
    await sendAdminCampaign('campaign', 'same-attempt', client);
    expect(requests).toHaveLength(2);
    for (const request of requests) {
      expect(request.headers.get('Idempotency-Key')).toBe('same-attempt');
      expect(request.headers.get('Authorization')).toBe('Bearer session-token');
      expect(request.method).toBe('POST');
      expect(request.url).toBe(
        'https://example.test/api/v1/admin/newsletter/campaigns/campaign/send',
      );
    }
  });

  it('envia filtro e página das duas listagens', async () => {
    const urls: URL[] = [];
    const client = createAuthenticatedApiClient({
      baseUrl: 'https://example.test',
      getAccessToken: () => 'token',
      fetch: (request) => {
        urls.push(new URL(request.url));
        return Promise.resolve(Response.json({ items: [], meta: {} }));
      },
    });
    await listAdminComments(2, 'SPAM', client);
    await listAdminCampaigns(3, 'FAILED', client);
    expect(urls[0]?.searchParams.get('status')).toBe('SPAM');
    expect(urls[0]?.searchParams.get('page')).toBe('2');
    expect(urls[1]?.searchParams.get('status')).toBe('FAILED');
    expect(urls[1]?.searchParams.get('page')).toBe('3');
  });

  it('preserva o motivo da moderação e propaga conflitos de estado', async () => {
    let body: unknown;
    const client = createAuthenticatedApiClient({
      baseUrl: 'https://example.test',
      getAccessToken: () => 'token',
      fetch: async (request) => {
        body = await request.json();
        return Response.json(
          { code: 'COMMENT_ALREADY_DELETED', message: 'Comentário excluído.' },
          { status: 409 },
        );
      },
    });
    await expect(
      moderateAdminComment('comment', 'SPAM', '  Divulgação indevida  ', client),
    ).rejects.toMatchObject({ code: 'COMMENT_ALREADY_DELETED', statusCode: 409 });
    expect(body).toEqual({ status: 'SPAM', reason: 'Divulgação indevida' });
  });
});
