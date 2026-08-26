import { ApplicationException } from '@api/core/http/exceptions/application.exception';
import { HttpStatus } from '@nestjs/common';

export class CampaignIdempotencyConflictException extends ApplicationException {
  constructor() {
    super({
      code: 'CAMPAIGN_IDEMPOTENCY_KEY_CONFLICT',
      message: 'A chave de idempotência já foi utilizada em outra campanha.',
      statusCode: HttpStatus.CONFLICT,
    });
  }
}
