import { ApiProperty } from '@nestjs/swagger';

export class AdminTagResponseDto {
  @ApiProperty({ example: '019c2d62-6e90-7000-8000-000000000011', format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'TypeScript' })
  name!: string;

  @ApiProperty({ example: 'typescript' })
  slug!: string;

  @ApiProperty({ example: true })
  isPublic!: boolean;

  @ApiProperty({ example: 12, minimum: 0 })
  publishedPostCount!: number;
}
