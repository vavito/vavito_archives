import type { ApplicationConfig } from '@api/core/config/app.config';
import { MailWebhookPayloadInvalidError } from '@api/core/mail/errors/mail-webhook-payload-invalid.error';
import { MailWebhookSignatureInvalidError } from '@api/core/mail/errors/mail-webhook-signature-invalid.error';
import type { ResendWebhookClient } from '@api/core/mail/providers/resend-webhook-client';
import { ResendWebhookVerifierService } from '@api/core/mail/services/resend-webhook-verifier.service';
import { ConfigService } from '@nestjs/config';

function config(): ConfigService<ApplicationConfig, true> {
  return new ConfigService<ApplicationConfig, true>({
    resend: { webhookSecret: 'whsec_test_webhook_signing_secret' },
  } as ApplicationConfig);
}

const EMAIL_DATA = {
  created_at: '2026-08-26T12:00:00.000Z',
  email_id: 'resend-email-id',
  from: 'newsletter@example.com',
  message_id: 'provider-message-id',
  subject: 'Novo artigo',
  to: ['leitor@example.com'],
};

describe('ResendWebhookVerifierService', () => {
  const verify = jest.fn<
    ReturnType<ResendWebhookClient['verify']>,
    Parameters<ResendWebhookClient['verify']>
  >();
  const client = { verify } as unknown as ResendWebhookClient;
  const service = new ResendWebhookVerifierService(client, config());
  const headers = {
    id: 'evt_123',
    signature: 'v1,signature',
    timestamp: '1787745600',
  };

  beforeEach(() => jest.clearAllMocks());

  it('verifica a assinatura e normaliza um evento de entrega', () => {
    const payload = '{"type":"email.delivered"}';
    verify.mockReturnValueOnce({
      created_at: '2026-08-26T12:00:00.000Z',
      data: EMAIL_DATA,
      type: 'email.delivered',
    });

    const result = service.verify({ headers, payload });
    expect(result).toMatchObject({
      bounceSubType: null,
      bounceType: null,
      occurredAt: new Date('2026-08-26T12:00:00.000Z'),
      providerEmailId: 'resend-email-id',
      providerEventId: 'evt_123',
      type: 'email.delivered',
    });
    expect(result.payloadHash).toMatch(/^[a-f0-9]{64}$/);
    expect(verify).toHaveBeenCalledWith({
      headers,
      payload,
      webhookSecret: 'whsec_test_webhook_signing_secret',
    });
  });

  it('preserva a classificação técnica de bounce sem guardar sua mensagem', () => {
    verify.mockReturnValueOnce({
      created_at: '2026-08-26T12:00:00.000Z',
      data: {
        ...EMAIL_DATA,
        bounce: { message: 'detalhes externos', subType: 'General', type: 'Permanent' },
      },
      type: 'email.bounced',
    });

    expect(service.verify({ headers, payload: '{"type":"email.bounced"}' })).toMatchObject({
      bounceSubType: 'General',
      bounceType: 'Permanent',
    });
  });

  it('rejeita headers ausentes e falha criptográfica', () => {
    expect(() => service.verify({ headers: {}, payload: '{}' })).toThrow(
      MailWebhookSignatureInvalidError,
    );
    verify.mockImplementationOnce(() => {
      throw new Error('assinatura inválida');
    });
    expect(() => service.verify({ headers, payload: '{}' })).toThrow(
      MailWebhookSignatureInvalidError,
    );
  });

  it('rejeita payload assinado com campos obrigatórios inválidos', () => {
    verify.mockReturnValueOnce({
      created_at: 'data-inválida',
      data: { ...EMAIL_DATA, email_id: '' },
      type: 'email.delivered',
    });

    expect(() => service.verify({ headers, payload: '{}' })).toThrow(
      MailWebhookPayloadInvalidError,
    );
  });
});
