import { HttpStatus } from '@nestjs/common';

import { ApplicationException } from '@api/core/http/exceptions/application.exception';

export class TagNotFoundException extends ApplicationException {
  constructor() {
    super({
      code: 'TAG_NOT_FOUND',
      message: 'Tópico não encontrado.',
      statusCode: HttpStatus.NOT_FOUND,
    });
  }
}
