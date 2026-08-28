import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { MediaAssetStatus } from '@api/modules/media/domain/enums/media-asset-status.enum';

export class MediaResponseDto {
  @ApiProperty({ example: '019c2d62-6e90-7000-8000-000000000020', format: 'uuid' })
  id!: string;

  @ApiProperty({
    example: 'https://project.supabase.co/storage/v1/object/public/media/2026/08/id.webp',
  })
  url!: string;

  @ApiProperty({ example: '2026/08/0198f75f-89df-4ae7-a1ec-2e7834b3021a.webp' })
  path!: string;

  @ApiProperty({ enum: ['image/jpeg', 'image/png', 'image/webp'], example: 'image/webp' })
  mimeType!: string;

  @ApiProperty({ example: 153_642, minimum: 1 })
  sizeBytes!: number;

  @ApiPropertyOptional({ example: 1200, minimum: 1, nullable: true })
  width!: number | null;

  @ApiPropertyOptional({ example: 630, minimum: 1, nullable: true })
  height!: number | null;

  @ApiProperty({ example: 'Diagrama da arquitetura da aplicação' })
  altText!: string;

  @ApiProperty({
    enum: MediaAssetStatus,
    enumName: 'MediaAssetStatus',
    example: MediaAssetStatus.READY,
  })
  status!: MediaAssetStatus;

  @ApiProperty({ example: '2026-08-22T15:00:00.000Z', format: 'date-time' })
  createdAt!: string;
}
