import { HttpStatus } from '@nestjs/common';

import { ApplicationException } from '@api/core/http/exceptions/application.exception';

export class ProfileIntegrationException extends ApplicationException {
  constructor(message: string, cause?: unknown) {
    super({
      cause,
      code: 'PROFILE_INTEGRATION_FAILED',
      message,
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
    });
  }
}
