import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTagVisibilityDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isPublic!: boolean;
}
