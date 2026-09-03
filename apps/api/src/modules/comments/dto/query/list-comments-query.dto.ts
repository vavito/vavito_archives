import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

import { CommentStatus } from '@api/modules/comments/domain/enums/comment-status.enum';
import {
  AdminPaginationQueryDto,
  FIRST_PAGE,
} from '@api/shared/pagination/dto/pagination-query.dto';

export const COMMENTS_DEFAULT_LIMIT = 20;
export const COMMENTS_MAX_LIMIT = 50;

export class ListCommentsQueryDto {
  @ApiPropertyOptional({ default: FIRST_PAGE, example: FIRST_PAGE, minimum: FIRST_PAGE })
  @Type(() => Number)
  @IsInt()
  @Min(FIRST_PAGE)
  page: number = FIRST_PAGE;

  @ApiPropertyOptional({
    default: COMMENTS_DEFAULT_LIMIT,
    example: COMMENTS_DEFAULT_LIMIT,
    maximum: COMMENTS_MAX_LIMIT,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(COMMENTS_MAX_LIMIT)
  limit: number = COMMENTS_DEFAULT_LIMIT;
}

export class ListAdminCommentsQueryDto extends AdminPaginationQueryDto {
  @ApiPropertyOptional({ example: '019c2d62-6e90-7000-8000-000000000010', format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  postId?: string;

  @ApiPropertyOptional({
    enum: CommentStatus,
    enumName: 'CommentStatus',
    example: CommentStatus.VISIBLE,
  })
  @IsOptional()
  @IsEnum(CommentStatus)
  status?: CommentStatus;
}
