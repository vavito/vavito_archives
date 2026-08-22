import { HttpStatus } from '@nestjs/common';

import { ApplicationException } from '@api/core/http/exceptions/application.exception';

export class CommentNotFoundException extends ApplicationException {
  constructor() {
    super({
      code: 'COMMENT_NOT_FOUND',
      message: 'Comentário não encontrado.',
      statusCode: HttpStatus.NOT_FOUND,
    });
  }
}
