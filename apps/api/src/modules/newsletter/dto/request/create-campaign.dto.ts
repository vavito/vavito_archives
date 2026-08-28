import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateCampaignDto {
  @ApiProperty({ example: '019c2d62-6e90-7000-8000-000000000010', format: 'uuid' })
  @IsUUID()
  postId!: string;

  @ApiProperty({ example: 'Novo artigo: Arquivos e memória digital', maxLength: 255 })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  subject!: string;

  @ApiPropertyOptional({ example: 'Uma nova leitura já está disponível.', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  previewText?: string;
}
