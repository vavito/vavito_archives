import { CONTACT_ACCEPTED_MESSAGE } from '@api/modules/contact/contact.constants';
import { ApiProperty } from '@nestjs/swagger';

export class ContactAcceptedResponseDto {
  @ApiProperty({ example: CONTACT_ACCEPTED_MESSAGE })
  message!: string;
}
