import { HttpStatus } from '@nestjs/common';

import { ApplicationException } from '@api/core/http/exceptions/application.exception';

export class MediaNotFoundException extends ApplicationException {
  constructor() {
    super({
      code: 'MEDIA_NOT_FOUND',
      message: 'Mídia não encontrada ou indisponível.',
      statusCode: HttpStatus.NOT_FOUND,
    });
  }
}
