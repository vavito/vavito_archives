import { HttpStatus } from '@nestjs/common';

import { ApplicationException } from '@api/core/http/exceptions/application.exception';

export class MediaFileTooLargeException extends ApplicationException {
  constructor() {
    super({
      code: 'PAYLOAD_TOO_LARGE',
      message: 'O arquivo de mídia deve ter no máximo 10 MB.',
      statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
    });
  }
}
