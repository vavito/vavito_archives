import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

import { PostStatus } from '@api/modules/posts/domain/enums/post-status.enum';
import { AdminPaginationQueryDto } from '@api/shared/pagination/dto/pagination-query.dto';

export class ListAdminPostsQueryDto extends AdminPaginationQueryDto {
  @ApiPropertyOptional({ enum: PostStatus, enumName: 'PostStatus' })
  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

  @ApiPropertyOptional({ example: 'arquitetura', maxLength: 200 })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().replaceAll(/\s+/g, ' ') : value,
  )
  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;
}
