import { ApplicationException } from '@api/core/http/exceptions/application.exception';
import { ContactMessageContentInvalidError } from '@api/modules/contact/domain/errors/contact-message-content-invalid.error';
import { ContactMessageStateInconsistentError } from '@api/modules/contact/domain/errors/contact-message-state-inconsistent.error';
import { InvalidContactMessageStatusTransitionError } from '@api/modules/contact/domain/errors/invalid-contact-message-status-transition.error';
import { HttpStatus } from '@nestjs/common';

export function throwContactDomainException(error: unknown): never {
  if (error instanceof ContactMessageContentInvalidError) {
    throw new ApplicationException({
      cause: error,
      code: error.code,
      message: 'Os dados da mensagem de contato são inválidos.',
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  }

  if (
    error instanceof ContactMessageStateInconsistentError ||
    error instanceof InvalidContactMessageStatusTransitionError
  ) {
    throw new ApplicationException({
      cause: error,
      code: error.code,
      message: 'O estado atual da mensagem de contato não permite esta ação.',
      statusCode: HttpStatus.CONFLICT,
    });
  }

  throw error;
}
