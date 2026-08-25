import { ApiProperty } from '@nestjs/swagger';

import {
  SUBSCRIPTION_ACCEPTED_MESSAGE,
  SUBSCRIPTION_CONFIRMED_MESSAGE,
} from '@api/modules/newsletter/newsletter.constants';

export class SubscriptionAcceptedResponseDto {
  @ApiProperty({ example: SUBSCRIPTION_ACCEPTED_MESSAGE })
  message!: string;
}

export class SubscriptionConfirmedResponseDto {
  @ApiProperty({ example: SUBSCRIPTION_CONFIRMED_MESSAGE })
  message!: string;
}
