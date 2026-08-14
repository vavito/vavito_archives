import { HttpStatus } from '@nestjs/common';

import { ApplicationException } from '@api/core/http/exceptions/application.exception';

export class AccountDeletionException extends ApplicationException {
  constructor(cause?: unknown) {
    super({
      cause,
      code: 'ACCOUNT_DELETION_FAILED',
      message: 'Não foi possível concluir a exclusão da conta. Tente novamente.',
      statusCode: HttpStatus.CONFLICT,
    });
  }
}
