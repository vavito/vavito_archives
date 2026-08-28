import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateCampaignDto {
  @ApiPropertyOptional({
    description: 'HTML completo usado no preview e congelado no envio.',
    example: '<article><h1>Novo artigo</h1><a href="{{unsubscribeUrl}}">Cancelar</a></article>',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  html?: string;

  @ApiPropertyOptional({ example: 'Uma nova leitura já está disponível.', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  previewText?: string;

  @ApiPropertyOptional({
    example: 'Novo artigo: Arquivos e memória digital',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  subject?: string;
}
