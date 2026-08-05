import { ApiProperty } from '@nestjs/swagger';

class ApiHealthCheckDto {
  @ApiProperty({ enum: ['up'], example: 'up' })
  declare status: 'up';
}

class HealthChecksDto {
  @ApiProperty({ type: ApiHealthCheckDto })
  declare api: ApiHealthCheckDto;
}

export class HealthResponseDto {
  @ApiProperty({ enum: ['ok'], example: 'ok' })
  declare status: 'ok';

  @ApiProperty({ example: '1.0.0' })
  declare version: string;

  @ApiProperty({ example: '2026-08-04T20:15:00.000Z', format: 'date-time' })
  declare timestamp: string;

  @ApiProperty({ type: HealthChecksDto })
  declare checks: HealthChecksDto;
}
