import { HttpStatus } from '@nestjs/common';

import { ApplicationException } from '@api/common/errors/application.exception';

export class UnauthenticatedException extends ApplicationException {
  constructor(cause?: unknown) {
    super({
      cause,
      code: 'UNAUTHENTICATED',
      message: 'Autenticação necessária.',
      statusCode: HttpStatus.UNAUTHORIZED,
    });
  }
}

