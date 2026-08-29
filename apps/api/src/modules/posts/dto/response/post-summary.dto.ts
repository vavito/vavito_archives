import { ApiProperty } from '@nestjs/swagger';

import { TagResponseDto } from '@api/modules/posts/dto/response/tag-response.dto';

export class PostSummaryDto {
  @ApiProperty({ example: '019c2d62-6e90-7000-8000-000000000010', format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'arquitetura-aplicacoes-nestjs' })
  slug!: string;

  @ApiProperty({ example: 'Arquitetura de aplicações NestJS' })
  title!: string;

  @ApiProperty({ example: 'Uma introdução prática à arquitetura do projeto.' })
  excerpt!: string;

  @ApiProperty({
    example: 'https://cdn.example.com/posts/capa.webp',
    nullable: true,
    type: String,
  })
  coverUrl!: string | null;

  @ApiProperty({ example: 'Diagrama de arquitetura', nullable: true, type: String })
  coverAlt!: string | null;

  @ApiProperty({ type: () => [TagResponseDto] })
  tags!: TagResponseDto[];

  @ApiProperty({ example: '2026-08-20T12:00:00.000Z', format: 'date-time' })
  publishedAt!: string;

  @ApiProperty({ example: 6, minimum: 0 })
  readingTimeMinutes!: number;

  @ApiProperty({ example: 128, minimum: 0 })
  viewCount!: number;
}
