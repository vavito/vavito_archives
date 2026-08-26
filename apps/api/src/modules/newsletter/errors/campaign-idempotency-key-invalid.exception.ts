import { ApplicationException } from '@api/core/http/exceptions/application.exception';
import { HttpStatus } from '@nestjs/common';

export class CampaignIdempotencyKeyInvalidException extends ApplicationException {
  constructor() {
    super({
      code: 'CAMPAIGN_IDEMPOTENCY_KEY_INVALID',
      message: 'O header Idempotency-Key deve conter um UUID válido.',
      statusCode: HttpStatus.BAD_REQUEST,
    });
  }
}
