import { ApiProperty } from '@nestjs/swagger';

export class ErrorDetailDto {
  @ApiProperty({ example: 'email' })
  field!: string;

  @ApiProperty({ example: 'INVALID_EMAIL' })
  reason!: string;
}

export class ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({ example: 'VALIDATION_ERROR' })
  code!: string;

  @ApiProperty({ example: 'Dados inválidos.' })
  message!: string;

  @ApiProperty({ nullable: true, type: () => [ErrorDetailDto] })
  details!: ErrorDetailDto[] | null;

  @ApiProperty({ example: '2026-08-12T20:15:00.000Z', format: 'date-time' })
  timestamp!: string;

  @ApiProperty({ example: '/api/v1/newsletter/subscriptions' })
  path!: string;

  @ApiProperty({ example: '019c2d62-6e90-7000-8000-000000000000' })
  requestId!: string;
}
