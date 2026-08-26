import { MailWebhookPayloadInvalidError } from '@api/core/mail/errors/mail-webhook-payload-invalid.error';
import { MailWebhookSignatureInvalidError } from '@api/core/mail/errors/mail-webhook-signature-invalid.error';
import { ApplicationException } from '@api/core/http/exceptions/application.exception';
import { HttpStatus } from '@nestjs/common';

export function throwResendWebhookException(error: unknown): never {
  if (error instanceof MailWebhookSignatureInvalidError) {
    throw new ApplicationException({
      cause: error,
      code: error.code,
      message: 'Assinatura do webhook inválida.',
      statusCode: HttpStatus.UNAUTHORIZED,
    });
  }
  if (error instanceof MailWebhookPayloadInvalidError) {
    throw new ApplicationException({
      cause: error,
      code: error.code,
      message: 'Payload do webhook inválido.',
      statusCode: HttpStatus.BAD_REQUEST,
    });
  }

  throw error;
}
