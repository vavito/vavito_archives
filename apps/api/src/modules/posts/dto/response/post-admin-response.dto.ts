import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { PostStatus } from '@api/modules/posts/domain/enums/post-status.enum';
import { TagResponseDto } from '@api/modules/posts/dto/response/tag-response.dto';

export class PostAuthorDto {
  @ApiProperty({ example: '019c2d62-6e90-7000-8000-000000000002', format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'João Victor' })
  displayName!: string;
}

export class PostAdminSummaryDto {
  @ApiProperty({ example: '019c2d62-6e90-7000-8000-000000000010', format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'arquitetura-aplicacoes-nestjs', nullable: true, type: String })
  slug!: string | null;

  @ApiProperty({ example: 'Arquitetura de aplicações NestJS' })
  title!: string;

  @ApiProperty({ enum: PostStatus, enumName: 'PostStatus', example: PostStatus.PUBLISHED })
  status!: PostStatus;

  @ApiProperty({ type: () => PostAuthorDto })
  author!: PostAuthorDto;

  @ApiProperty({
    example: '2026-08-20T12:00:00.000Z',
    format: 'date-time',
    nullable: true,
    type: String,
  })
  publishedAt!: string | null;

  @ApiProperty({
    example: '2026-08-25T18:30:00.000Z',
    format: 'date-time',
    nullable: true,
    type: String,
  })
  editedAt!: string | null;

  @ApiProperty({ example: '2026-08-27T20:15:00.000Z', format: 'date-time' })
  updatedAt!: string;
}

export class PostAdminDetailDto extends PostAdminSummaryDto {
  @ApiProperty({ example: false })
  hasPendingChanges!: boolean;

  @ApiProperty({ example: null, format: 'date-time', nullable: true, type: String })
  pendingEditedAt!: string | null;
  @ApiProperty({
    example: 'Uma introdução prática à arquitetura.',
    nullable: true,
    type: String,
  })
  excerpt!: string | null;

  @ApiProperty({
    additionalProperties: true,
    example: { content: [{ type: 'paragraph' }], type: 'doc' },
    type: 'object',
  })
  content!: Record<string, unknown>;

  @ApiProperty({ example: 1, minimum: 1 })
  contentSchemaVersion!: number;

  @ApiProperty({ type: () => [TagResponseDto] })
  tags!: TagResponseDto[];

  @ApiProperty({ example: ['NestJS', 'TypeScript'], type: [String] })
  tagNames!: string[];

  @ApiProperty({
    example: '019c2d62-6e90-7000-8000-000000000020',
    format: 'uuid',
    nullable: true,
    type: String,
  })
  coverMediaId!: string | null;

  @ApiProperty({
    example: 'https://cdn.example.com/posts/capa.webp',
    nullable: true,
    type: String,
  })
  coverUrl!: string | null;

  @ApiProperty({ example: 'Diagrama de arquitetura', nullable: true, type: String })
  coverAlt!: string | null;

  @ApiPropertyOptional({ example: 100, maximum: 160, minimum: 100, required: false })
  coverScale?: number;

  @ApiPropertyOptional({ example: 50, maximum: 100, minimum: 0, required: false })
  coverPositionX?: number;

  @ApiPropertyOptional({ example: 50, maximum: 100, minimum: 0, required: false })
  coverPositionY?: number;

  @ApiProperty({ example: 'Arquitetura NestJS', nullable: true, type: String })
  seoTitle!: string | null;

  @ApiProperty({
    example: 'Aprenda a organizar uma aplicação NestJS.',
    nullable: true,
    type: String,
  })
  seoDescription!: string | null;

  @ApiProperty({ example: 6, minimum: 0 })
  readingTimeMinutes!: number;

  @ApiProperty({ example: 128, minimum: 0 })
  viewCount!: number;

  @ApiProperty({
    example: null,
    format: 'date-time',
    nullable: true,
    type: String,
  })
  archivedAt!: string | null;

  @ApiProperty({ example: '2026-08-18T10:00:00.000Z', format: 'date-time' })
  createdAt!: string;
}

export class PostRevisionAdminDto {
  @ApiProperty({ example: '019c2d62-6e90-7000-8000-000000000030', format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 2, minimum: 1 })
  version!: number;

  @ApiProperty({ type: () => PostAuthorDto })
  editor!: PostAuthorDto;

  @ApiProperty({
    additionalProperties: true,
    description: 'Snapshot integral do post antes da edição publicada.',
    example: {
      excerpt: 'Resumo anterior.',
      slug: 'arquitetura-aplicacoes-nestjs',
      title: 'Arquitetura de aplicações NestJS',
    },
    type: 'object',
  })
  snapshot!: Record<string, unknown>;

  @ApiProperty({ example: '2026-08-25T18:30:00.000Z', format: 'date-time' })
  createdAt!: string;
}
