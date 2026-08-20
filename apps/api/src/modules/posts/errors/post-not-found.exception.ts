import { HttpStatus } from '@nestjs/common';

import { ApplicationException } from '@api/core/http/exceptions/application.exception';

export class PostNotFoundException extends ApplicationException {
  constructor() {
    super({
      code: 'POST_NOT_FOUND',
      message: 'Post não encontrado.',
      statusCode: HttpStatus.NOT_FOUND,
    });
  }
}
