import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { MAX_COMMENT_CONTENT_LENGTH } from '@api/modules/comments/domain/value-objects/comment-content.value-object';

export class CreateCommentDto {
  @ApiProperty({
    example: 'Excelente explicação sobre a arquitetura do projeto.',
    maxLength: MAX_COMMENT_CONTENT_LENGTH,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_COMMENT_CONTENT_LENGTH)
  content!: string;

  @ApiPropertyOptional({ example: '019c2d62-6e90-7000-8000-000000000040', format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  parentId?: string;
}
