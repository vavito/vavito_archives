import { ApiProperty } from '@nestjs/swagger';

class DatabaseReadinessCheckDto {
  @ApiProperty({ enum: ['up', 'down'], example: 'up' })
  declare status: 'up' | 'down';
}

class ReadinessChecksDto {
  @ApiProperty({ type: DatabaseReadinessCheckDto })
  declare database: DatabaseReadinessCheckDto;
}

export class ReadinessResponseDto {
  @ApiProperty({ enum: ['ok', 'error'], example: 'ok' })
  declare status: 'ok' | 'error';

  @ApiProperty({ example: '2026-08-05T20:15:00.000Z', format: 'date-time' })
  declare timestamp: string;

  @ApiProperty({ type: ReadinessChecksDto })
  declare checks: ReadinessChecksDto;
}
