import { ApplicationException } from '@api/core/http/exceptions/application.exception';
import { InvalidSubscriberStatusTransitionError } from '@api/modules/newsletter/domain/errors/invalid-subscriber-status-transition.error';
import { SubscriberConfirmationTokenExpiredError } from '@api/modules/newsletter/domain/errors/subscriber-confirmation-token-expired.error';
import { SubscriberConfirmationTokenInvalidError } from '@api/modules/newsletter/domain/errors/subscriber-confirmation-token-invalid.error';
import { SubscriberConsentRequiredError } from '@api/modules/newsletter/domain/errors/subscriber-consent-required.error';
import { SubscriberEmailInvalidError } from '@api/modules/newsletter/domain/errors/subscriber-email-invalid.error';
import { SubscriberSuppressedError } from '@api/modules/newsletter/domain/errors/subscriber-suppressed.error';
import { SubscriberTokenHashInvalidError } from '@api/modules/newsletter/domain/errors/subscriber-token-hash-invalid.error';
import { HttpStatus } from '@nestjs/common';

function applicationException(
  error: Error & { code: string },
  message: string,
  statusCode: HttpStatus,
): ApplicationException {
  return new ApplicationException({ cause: error, code: error.code, message, statusCode });
}

export function throwSubscriberDomainException(error: unknown): never {
  if (error instanceof SubscriberConfirmationTokenExpiredError) {
    throw applicationException(
      error,
      'O token de confirmação expirou. Solicite uma nova inscrição.',
      HttpStatus.GONE,
    );
  }
  if (error instanceof SubscriberConfirmationTokenInvalidError) {
    throw applicationException(error, 'O token de confirmação é inválido.', HttpStatus.BAD_REQUEST);
  }
  if (
    error instanceof SubscriberConsentRequiredError ||
    error instanceof SubscriberEmailInvalidError ||
    error instanceof SubscriberTokenHashInvalidError
  ) {
    throw applicationException(
      error,
      'Os dados da inscrição são inválidos.',
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
  if (
    error instanceof InvalidSubscriberStatusTransitionError ||
    error instanceof SubscriberSuppressedError
  ) {
    throw applicationException(
      error,
      'O estado atual da inscrição não permite esta ação.',
      HttpStatus.CONFLICT,
    );
  }

  throw error;
}
