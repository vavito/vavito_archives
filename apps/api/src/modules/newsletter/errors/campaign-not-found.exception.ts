import { ApplicationException } from '@api/core/http/exceptions/application.exception';
import { HttpStatus } from '@nestjs/common';

export class CampaignNotFoundException extends ApplicationException {
  constructor() {
    super({
      code: 'CAMPAIGN_NOT_FOUND',
      message: 'Campanha não encontrada.',
      statusCode: HttpStatus.NOT_FOUND,
    });
  }
}
