import { HttpStatus } from '@nestjs/common';

import { ApplicationException } from '@api/core/http/exceptions/application.exception';

export class SlugAlreadyExistsException extends ApplicationException {
  constructor() {
    super({
      code: 'SLUG_ALREADY_EXISTS',
      message: 'Este slug já está em uso.',
      statusCode: HttpStatus.CONFLICT,
    });
  }
}
