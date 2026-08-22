import { HttpStatus } from '@nestjs/common';

import { ApplicationException } from '@api/core/http/exceptions/application.exception';

export class MediaFileUnsupportedException extends ApplicationException {
  constructor() {
    super({
      code: 'UNSUPPORTED_MEDIA_TYPE',
      message: 'Envie uma imagem JPEG, PNG ou WebP válida e com extensão correspondente.',
      statusCode: HttpStatus.UNSUPPORTED_MEDIA_TYPE,
    });
  }
}
