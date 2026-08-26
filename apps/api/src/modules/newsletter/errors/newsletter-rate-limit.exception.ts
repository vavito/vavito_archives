import { ApplicationException } from '@api/core/http/exceptions/application.exception';
import { HttpStatus } from '@nestjs/common';

export class NewsletterRateLimitException extends ApplicationException {
  constructor() {
    super({
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Limite de solicitações da newsletter excedido. Tente novamente em instantes.',
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
    });
  }
}
