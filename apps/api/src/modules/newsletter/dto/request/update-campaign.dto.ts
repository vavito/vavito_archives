import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateCampaignDto {
  @ApiPropertyOptional({ description: 'HTML completo usado no preview e congelado no envio.' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  html?: string;

  @ApiPropertyOptional({ maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  previewText?: string;

  @ApiPropertyOptional({ maxLength: 255 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  subject?: string;
}
