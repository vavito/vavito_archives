import { Transform } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

import { MAX_POST_TITLE_LENGTH } from '@api/modules/posts/dto/request/create-post.dto';
import { MAX_POST_SLUG_LENGTH } from '@api/modules/posts/domain/value-objects/slug.value-object';

export const MAX_POST_SEO_TITLE_LENGTH = 70;
export const MAX_POST_SEO_DESCRIPTION_LENGTH = 160;
export const MAX_TAG_NAME_LENGTH = 100;

function trimText(value: unknown): unknown {
  return typeof value === 'string' ? value.trim().replaceAll(/\s+/g, ' ') : value;
}

export class UpdatePostDto {
  @ApiPropertyOptional({ example: 'Arquitetura de aplicações NestJS', maxLength: 200 })
  @Transform(({ value }: { value: unknown }) => trimText(value))
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

  @ApiPropertyOptional({ example: 'Uma introdução prática à arquitetura do projeto.' })
  @Transform(({ value }: { value: unknown }) => trimText(value))
  @IsOptional()
  @IsString()
  excerpt?: string;

  @ApiPropertyOptional({
    additionalProperties: true,
    example: { content: [{ type: 'paragraph' }], type: 'doc' },
    type: 'object',
  })
  @IsOptional()
  @IsObject()
  content?: Record<string, unknown>;

  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  contentSchemaVersion?: number;

  @ApiPropertyOptional({ example: ['NestJS', 'TypeScript'], type: [String] })
  @Transform(({ value }: { value: unknown }) =>
    Array.isArray(value) ? value.map((item) => trimText(item)) : value,
  )
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(MAX_TAG_NAME_LENGTH, { each: true })
  @ArrayUnique((value: string) => value.toLowerCase())
  tagNames?: string[];

  @ApiPropertyOptional({
    example: '019c2d62-6e90-7000-8000-000000000020',
    format: 'uuid',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  coverMediaId?: string | null;

  @ApiPropertyOptional({ example: 'Arquitetura NestJS', maxLength: 70, nullable: true })
  @Transform(({ value }: { value: unknown }) => trimText(value))
  @IsOptional()
  @IsString()
  @MaxLength(MAX_POST_SEO_TITLE_LENGTH)
  seoTitle?: string | null;

  @ApiPropertyOptional({
    example: 'Aprenda a organizar uma aplicação NestJS.',
    maxLength: 160,
    nullable: true,
  })
  @Transform(({ value }: { value: unknown }) => trimText(value))
  @IsOptional()
  @IsString()
  @MaxLength(MAX_POST_SEO_DESCRIPTION_LENGTH)
  seoDescription?: string | null;
}
