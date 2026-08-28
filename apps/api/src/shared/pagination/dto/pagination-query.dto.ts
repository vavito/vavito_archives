import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export const FIRST_PAGE = 1;
export const PUBLIC_POSTS_DEFAULT_LIMIT = 12;
export const PUBLIC_POSTS_MAX_LIMIT = 24;
export const ADMIN_DEFAULT_LIMIT = 20;
export const ADMIN_MAX_LIMIT = 100;

export class PublicPostsPaginationQueryDto {
  @ApiPropertyOptional({ default: FIRST_PAGE, example: FIRST_PAGE, minimum: FIRST_PAGE })
  @Type(() => Number)
  @IsInt()
  @Min(FIRST_PAGE)
  page = FIRST_PAGE;

  @ApiPropertyOptional({
    default: PUBLIC_POSTS_DEFAULT_LIMIT,
    example: PUBLIC_POSTS_DEFAULT_LIMIT,
    maximum: PUBLIC_POSTS_MAX_LIMIT,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PUBLIC_POSTS_MAX_LIMIT)
  limit = PUBLIC_POSTS_DEFAULT_LIMIT;
}

export class AdminPaginationQueryDto {
  @ApiPropertyOptional({ default: FIRST_PAGE, example: FIRST_PAGE, minimum: FIRST_PAGE })
  @Type(() => Number)
  @IsInt()
  @Min(FIRST_PAGE)
  page = FIRST_PAGE;

  @ApiPropertyOptional({
    default: ADMIN_DEFAULT_LIMIT,
    example: ADMIN_DEFAULT_LIMIT,
    maximum: ADMIN_MAX_LIMIT,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(ADMIN_MAX_LIMIT)
  limit = ADMIN_DEFAULT_LIMIT;
}
