import { Transform } from 'class-transformer';
import { Equals, IsEmail, IsEnum, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { SubscriberConsentSource } from '@api/modules/newsletter/domain/enums/subscriber-consent-source.enum';
import { MAX_SUBSCRIBER_EMAIL_LENGTH } from '@api/modules/newsletter/domain/value-objects/subscriber-email.value-object';

export class SubscribeNewsletterDto {
  @ApiProperty({ example: 'leitor@example.com', maxLength: MAX_SUBSCRIBER_EMAIL_LENGTH })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @IsEmail()
  @MaxLength(MAX_SUBSCRIBER_EMAIL_LENGTH)
  email!: string;

  @ApiProperty({ enum: [true], example: true })
  @Equals(true)
  consent!: true;

  @ApiProperty({
    enum: SubscriberConsentSource,
    enumName: 'SubscriberConsentSource',
    example: SubscriberConsentSource.ARTICLE,
  })
  @IsEnum(SubscriberConsentSource)
  source!: SubscriberConsentSource;
}
