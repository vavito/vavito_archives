import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

import { PublicPostsPaginationQueryDto } from '@api/shared/pagination/dto/pagination-query.dto';

export enum PublicPostsSort {
  LEAST_VIEWED = 'least-viewed',
  OLDEST = 'oldest',
  POPULAR = 'popular',
  RECENT = 'recent',
}

export class ListPublicPostsQueryDto extends PublicPostsPaginationQueryDto {
  @ApiPropertyOptional({ example: 'typescript', maxLength: 120 })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  tag?: string;

  @ApiPropertyOptional({
    default: PublicPostsSort.RECENT,
    enum: PublicPostsSort,
    enumName: 'PublicPostsSort',
    example: PublicPostsSort.RECENT,
  })
  @IsOptional()
  @IsEnum(PublicPostsSort)
  sort = PublicPostsSort.RECENT;
}
