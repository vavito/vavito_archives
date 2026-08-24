import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CreateEmailRequestOptions, CreateEmailResponse } from 'resend';

import type { ApplicationConfig } from '@api/core/config/app.config';
import type { MailDeliveryError } from '@api/core/mail/errors/mail-delivery.error';
import type { ResendEmailClient } from '@api/core/mail/providers/resend-email-client';
import type { NewCommentNotification } from '@api/core/mail/services/mail.service';
import { ResendService } from '@api/core/mail/services/resend.service';

const notification: NewCommentNotification = {
  authorDisplayName: 'Leitor',
  commentContent: 'Comentário para revisão.',
  commentId: 'df23c92d-71e4-400b-805e-975bbc3e1788',
  isReply: false,
  postTitle: 'Artigo publicado',
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
