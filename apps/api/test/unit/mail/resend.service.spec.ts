import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CreateEmailRequestOptions, CreateEmailResponse } from 'resend';

import type { ApplicationConfig } from '@api/core/config/app.config';
import type { MailDeliveryError } from '@api/core/mail/errors/mail-delivery.error';
import type { ResendEmailClient } from '@api/core/mail/providers/resend-email-client';
import type {
  AccountDeletionNotification,
  ContactMessageNotification,
  NewCommentNotification,
  NewsletterCampaignNotification,
  NewsletterConfirmationNotification,
} from '@api/core/mail/services/mail.service';
import { ResendService } from '@api/core/mail/services/resend.service';

const notification: NewCommentNotification = {
  authorDisplayName: 'Leitor',
  commentContent: 'Comentário para revisão.',
  commentId: 'df23c92d-71e4-400b-805e-975bbc3e1788',
  isReply: false,
  postTitle: 'Artigo publicado',
};

const accountDeletionNotification: AccountDeletionNotification = {
  profileId: '2cc721a8-2db5-4e7f-b68a-d807546b5206',
  recipient: 'leitor@example.com',
};

const contactNotification: ContactMessageNotification = {
  contactMessageId: '49d6cdaa-a5f5-4716-9b27-39006338557b',
  message: 'Gostaria de sugerir uma nova pauta.',
  name: 'Leitor',
  replyTo: 'leitor@example.com',
  subject: 'Sugestão',
};

const newsletterNotification: NewsletterConfirmationNotification = {
  confirmationToken: 'A'.repeat(43),
  confirmationTokenHash: 'a'.repeat(64),
  recipient: 'leitor@example.com',
  subscriberId: '2813645a-8b74-4d1f-96c3-72cf3c594ad3',
  unsubscribeToken: 'B'.repeat(43),
};

const campaignNotification: NewsletterCampaignNotification = {
  articleUrl: 'https://vavitoarchives.com.br/artigos/artigo-publicado',
  campaignId: '0b68ee40-f392-49cb-95c4-dd19cdd1bd43',
  deliveryId: '49244eb5-fd04-438f-8d1d-a42e318c9bcd',
  htmlSnapshot: '<html><a href="{{unsubscribeUrl}}">Cancelar</a></html>',
  previewText: 'Nova leitura disponível',
  recipient: 'leitor@example.com',
  subject: 'Novo artigo',
  unsubscribeToken: 'B'.repeat(43),
};

function successfulResponse(id = 'email-id'): CreateEmailResponse {
  return { data: { id }, error: null, headers: {} };
}

function config(
  options: { maxAttempts?: number; timeoutMs?: number } = {},
): ConfigService<ApplicationConfig, true> {
  return new ConfigService<ApplicationConfig, true>({
    app: {
      environment: 'test',
      frontendUrl: 'https://vavitoarchives.com.br',
      port: 3001,
      swaggerEnabled: true,
      version: '0.0.0-test',
    },
    resend: {
      adminRecipient: 'admin@example.com',
      apiKey: 're_test',
      contactFrom: 'Vavito Archives <notifications@contact.vavitoarchives.com.br>',
      maxAttempts: options.maxAttempts ?? 3,
      newsletterFrom: 'Vavito Archives <newsletter@newsletter.vavitoarchives.com.br>',
      replyTo: 'contato@example.com',
      timeoutMs: options.timeoutMs ?? 5_000,
    },
  } as ApplicationConfig);
}

describe('ResendService', () => {
  const send = jest.fn<
    ReturnType<ResendEmailClient['send']>,
    Parameters<ResendEmailClient['send']>
  >();
  const client: ResendEmailClient = { send };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it('normaliza a resposta e usa remetente, reply-to e idempotência internos', async () => {
    send.mockResolvedValueOnce(successfulResponse('resend-message-id'));
    const service = new ResendService(client, config());

    await expect(service.sendNewCommentNotification(notification)).resolves.toEqual({
      messageId: 'resend-message-id',
      provider: 'resend',
    });
    const [payload, options] = send.mock.calls[0]!;
    const requestOptions = options as CreateEmailRequestOptions & { signal?: unknown };

    expect(payload).toMatchObject({
      from: 'Vavito Archives <notifications@contact.vavitoarchives.com.br>',
      replyTo: 'contato@example.com',
      to: 'admin@example.com',
    });
    expect(requestOptions.idempotencyKey).toBe(`new-comment/${notification.commentId}`);
    expect(requestOptions.signal).toBeInstanceOf(AbortSignal);
  });

  it('envia o contato ao administrador com reply-to do visitante', async () => {
    send.mockResolvedValueOnce(successfulResponse('contact-message-id'));
    const service = new ResendService(client, config());

    await expect(service.sendContactMessageNotification(contactNotification)).resolves.toEqual({
      messageId: 'contact-message-id',
      provider: 'resend',
    });
    const [payload, options] = send.mock.calls[0]!;

    expect(payload).toMatchObject({
      from: 'Vavito Archives <notifications@contact.vavitoarchives.com.br>',
      replyTo: 'leitor@example.com',
      to: 'admin@example.com',
    });
    expect(options?.idempotencyKey).toBe(`contact-message/${contactNotification.contactMessageId}`);
  });

  it('envia a confirmação da exclusão para o antigo titular da conta', async () => {
    send.mockResolvedValueOnce(successfulResponse('account-deletion-message-id'));
    const service = new ResendService(client, config());

    await expect(
      service.sendAccountDeletionNotification(accountDeletionNotification),
    ).resolves.toEqual({
      messageId: 'account-deletion-message-id',
      provider: 'resend',
    });
    const [payload, options] = send.mock.calls[0]!;

    expect(payload).toMatchObject({
      from: 'Vavito Archives <notifications@contact.vavitoarchives.com.br>',
      subject: 'Sua conta no Vavito Archives foi excluída',
      to: 'leitor@example.com',
    });
    expect(options?.idempotencyKey).toBe(
      `account-deletion/${accountDeletionNotification.profileId}`,
    );
  });

  it('repete falha transitória com a mesma chave de idempotência', async () => {
    send
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'indisponível', name: 'internal_server_error', statusCode: 500 },
        headers: {},
      })
      .mockResolvedValueOnce(successfulResponse());
    const service = new ResendService(client, config({ maxAttempts: 2 }));

    await expect(service.sendNewCommentNotification(notification)).resolves.toEqual({
      messageId: 'email-id',
      provider: 'resend',
    });
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[0]?.[1]?.idempotencyKey).toBe(send.mock.calls[1]?.[1]?.idempotencyKey);
  });

  it('envia double opt-in pelo remetente da newsletter com links reais', async () => {
    send.mockResolvedValueOnce(successfulResponse('newsletter-message-id'));
    const service = new ResendService(client, config());

    await expect(service.sendNewsletterConfirmation(newsletterNotification)).resolves.toEqual({
      messageId: 'newsletter-message-id',
      provider: 'resend',
    });
    const [payload, options] = send.mock.calls[0]!;

    expect(payload).toMatchObject({
      from: 'Vavito Archives <newsletter@newsletter.vavitoarchives.com.br>',
      replyTo: 'contato@example.com',
      to: 'leitor@example.com',
    });
    expect(payload.html).toContain(
      `https://vavitoarchives.com.br/newsletter/confirm#token=${newsletterNotification.confirmationToken}`,
    );
    expect(payload.text).toContain(
      `https://vavitoarchives.com.br/newsletter/unsubscribe#token=${newsletterNotification.unsubscribeToken}`,
    );
    expect(options?.idempotencyKey).toBe(
      `newsletter-confirmation/${newsletterNotification.subscriberId}/${newsletterNotification.confirmationTokenHash}`,
    );
  });

  it('personaliza campanha com cancelamento e chave por entrega', async () => {
    send.mockResolvedValueOnce(successfulResponse('campaign-message-id'));
    const service = new ResendService(client, config());

    await expect(service.sendNewsletterCampaign(campaignNotification)).resolves.toEqual({
      messageId: 'campaign-message-id',
      provider: 'resend',
    });
    const [payload, options] = send.mock.calls[0]!;

    expect(payload).toMatchObject({
      from: 'Vavito Archives <newsletter@newsletter.vavitoarchives.com.br>',
      subject: 'Novo artigo',
      to: 'leitor@example.com',
    });
    expect(payload.html).toContain(
      `https://vavitoarchives.com.br/newsletter/unsubscribe#token=${campaignNotification.unsubscribeToken}`,
    );
    expect(payload.html).not.toContain('{{unsubscribeUrl}}');
    expect(options?.idempotencyKey).toBe(
      `newsletter-campaign/${campaignNotification.campaignId}/${campaignNotification.deliveryId}`,
    );
  });

  it('não repete erro de validação do provedor', async () => {
    send.mockResolvedValueOnce({
      data: null,
      error: { message: 'remetente inválido', name: 'invalid_from_address', statusCode: 422 },
      headers: {},
    });
    const service = new ResendService(client, config());

    await expect(service.sendNewCommentNotification(notification)).rejects.toMatchObject({
      providerCode: 'invalid_from_address',
      retryable: false,
      statusCode: 422,
    });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('interrompe a espera quando o timeout é atingido', async () => {
    send.mockImplementationOnce(() => new Promise(() => undefined));
    const service = new ResendService(client, config({ maxAttempts: 1, timeoutMs: 10 }));

    await expect(service.sendNewCommentNotification(notification)).rejects.toEqual(
      expect.objectContaining<Partial<MailDeliveryError>>({
        providerCode: 'request_timeout',
        retryable: true,
      }),
    );
  });
});
