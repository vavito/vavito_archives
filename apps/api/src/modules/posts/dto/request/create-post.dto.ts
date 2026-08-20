import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

import { MAX_POST_SLUG_LENGTH } from '@api/modules/posts/domain/value-objects/slug.value-object';

export const MAX_POST_TITLE_LENGTH = 200;

export class CreatePostDto {
  @ApiPropertyOptional({ example: 'Arquitetura de aplicações NestJS', maxLength: 200 })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().replaceAll(/\s+/g, ' ') : value,
  )
  @IsOptional()
  @IsString()
  @MaxLength(MAX_POST_TITLE_LENGTH)
  title?: string;

  @ApiPropertyOptional({ example: 'arquitetura-aplicacoes-nestjs', maxLength: 255 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_POST_SLUG_LENGTH)
  slug?: string;
}
