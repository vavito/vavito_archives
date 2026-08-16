import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'João Victor', maxLength: 120 })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().replaceAll(/\s+/g, ' ') : value,
  )
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  displayName?: string;
}
