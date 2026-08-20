import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TagResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'TypeScript' })
  name!: string;

  @ApiProperty({ example: 'typescript' })
  slug!: string;

  @ApiPropertyOptional({ example: 12, minimum: 0 })
  publishedPostCount?: number;
}
