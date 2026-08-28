import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TagResponseDto {
  @ApiProperty({ example: '019c2d62-6e90-7000-8000-000000000011', format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'TypeScript' })
  name!: string;

  @ApiProperty({ example: 'typescript' })
  slug!: string;

  @ApiPropertyOptional({ example: 12, minimum: 0 })
  publishedPostCount?: number;
}
