import { ApplicationException } from '@api/core/http/exceptions/application.exception';
import { SUBSCRIBER_CONFIRMATION_TOKEN_INVALID } from '@api/modules/newsletter/domain/errors/subscriber-confirmation-token-invalid.error';
import { HttpStatus } from '@nestjs/common';

export class SubscriberTokenInvalidException extends ApplicationException {
  constructor() {
    super({
      code: SUBSCRIBER_CONFIRMATION_TOKEN_INVALID,
      message: 'O token de confirmação é inválido.',
      statusCode: HttpStatus.BAD_REQUEST,
    });
  }
}
