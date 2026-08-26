import { ApplicationException } from '@api/core/http/exceptions/application.exception';
import { HttpStatus } from '@nestjs/common';

export class CampaignProviderRejectedException extends ApplicationException {
  constructor() {
    super({
      code: 'CAMPAIGN_PROVIDER_REJECTED',
      message: 'O provedor não aceitou o envio da campanha.',
      statusCode: HttpStatus.BAD_GATEWAY,
    });
  }
}
