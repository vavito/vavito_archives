import { HttpStatus } from '@nestjs/common';

import { ApplicationException } from '@api/core/http/exceptions/application.exception';

export class CommentsRateLimitException extends ApplicationException {
  constructor() {
    super({
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Limite de comentários excedido. Tente novamente em instantes.',
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
    });
  }
}
