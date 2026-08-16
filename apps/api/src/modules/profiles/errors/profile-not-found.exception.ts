import { HttpStatus } from '@nestjs/common';

import { ApplicationException } from '@api/core/http/exceptions/application.exception';

export class ProfileNotFoundException extends ApplicationException {
  constructor() {
    super({
      code: 'PROFILE_NOT_FOUND',
      message: 'Perfil não encontrado.',
      statusCode: HttpStatus.NOT_FOUND,
    });
  }
}
