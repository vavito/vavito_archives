import { HttpStatus } from '@nestjs/common';

import { ApplicationException } from '@api/core/http/exceptions/application.exception';

export class MediaFileRequiredException extends ApplicationException {
  constructor() {
    super({
      code: 'VALIDATION_ERROR',
      details: [{ field: 'file', reason: 'REQUIRED' }],
      message: 'O arquivo de mídia é obrigatório.',
      statusCode: HttpStatus.BAD_REQUEST,
    });
  }
}
