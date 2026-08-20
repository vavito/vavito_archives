import { ApiProperty } from '@nestjs/swagger';

import { PostStatus } from '@api/modules/posts/domain/enums/post-status.enum';
import { TagResponseDto } from '@api/modules/posts/dto/response/tag-response.dto';

export class PostAuthorDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'João Victor' })
  displayName!: string;
}

export class PostAdminSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'arquitetura-aplicacoes-nestjs', nullable: true })
  slug!: string | null;

  @ApiProperty({ example: 'Arquitetura de aplicações NestJS' })
  title!: string;

  @ApiProperty({ enum: PostStatus, enumName: 'PostStatus' })
  status!: PostStatus;

  @ApiProperty({ type: () => PostAuthorDto })
  author!: PostAuthorDto;

  @ApiProperty({ format: 'date-time', nullable: true })
  publishedAt!: string | null;

  @ApiProperty({ format: 'date-time', nullable: true })
  editedAt!: string | null;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;
}

export class PostAdminDetailDto extends PostAdminSummaryDto {
  @ApiProperty({ example: 'Uma introdução prática à arquitetura.', nullable: true })
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

  @ApiProperty({ format: 'uuid', nullable: true })
  coverMediaId!: string | null;

  @ApiProperty({ example: 'https://cdn.example.com/posts/capa.webp', nullable: true })
  coverUrl!: string | null;

  @ApiProperty({ example: 'Diagrama de arquitetura', nullable: true })
  coverAlt!: string | null;

  @ApiProperty({ example: 'Arquitetura NestJS', nullable: true })
  seoTitle!: string | null;

  @ApiProperty({ example: 'Aprenda a organizar uma aplicação NestJS.', nullable: true })
  seoDescription!: string | null;

  @ApiProperty({ example: 6, minimum: 0 })
  readingTimeMinutes!: number;

  @ApiProperty({ example: 128, minimum: 0 })
  viewCount!: number;

  @ApiProperty({ format: 'date-time', nullable: true })
  archivedAt!: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;
}

export class PostRevisionAdminDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 2, minimum: 1 })
  version!: number;

  @ApiProperty({ type: () => PostAuthorDto })
  editor!: PostAuthorDto;

  @ApiProperty({
    additionalProperties: true,
    description: 'Snapshot integral do post antes da edição publicada.',
    type: 'object',
  })
  snapshot!: Record<string, unknown>;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;
}
