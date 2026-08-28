import { IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { MAX_COMMENT_CONTENT_LENGTH } from '@api/modules/comments/domain/value-objects/comment-content.value-object';

export class UpdateCommentDto {
  @ApiProperty({
    example: 'Comentário atualizado com uma informação complementar.',
    maxLength: MAX_COMMENT_CONTENT_LENGTH,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_COMMENT_CONTENT_LENGTH)
  content!: string;
}
