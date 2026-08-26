import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { SUBSCRIBER_RAW_TOKEN_LENGTH } from '@api/modules/newsletter/newsletter.constants';

const subscriberTokenPattern = new RegExp(`^[A-Za-z0-9_-]{${SUBSCRIBER_RAW_TOKEN_LENGTH}}$`);

export class UnsubscribeDto {
  @ApiProperty({
    description: 'Token opaco recebido nos emails da newsletter.',
    example: 'HfByP6b1hQ9lBf8Nw5vVJdWxe_vf1EpfkNGYw1iHt7Q',
  })
  @IsString()
  @Matches(subscriberTokenPattern)
  token!: string;
}
