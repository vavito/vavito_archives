import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { MAX_COMMENT_CONTENT_LENGTH } from '@api/modules/comments/domain/value-objects/comment-content.value-object';

export class CreateCommentDto {
  @ApiProperty({ maxLength: MAX_COMMENT_CONTENT_LENGTH })
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_COMMENT_CONTENT_LENGTH)
  content!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  parentId?: string;
}
