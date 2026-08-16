import { HttpStatus } from '@nestjs/common';

import { ApplicationException } from '@api/core/http/exceptions/application.exception';

export class ForbiddenAccessException extends ApplicationException {
  constructor() {
    super({
      code: 'FORBIDDEN',
      message: 'Acesso não autorizado.',
      statusCode: HttpStatus.FORBIDDEN,
    });
  }
}
