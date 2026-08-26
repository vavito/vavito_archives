import { ApiProperty } from '@nestjs/swagger';

export class WebhookReceivedResponseDto {
  @ApiProperty({ example: true })
  received!: true;
}
