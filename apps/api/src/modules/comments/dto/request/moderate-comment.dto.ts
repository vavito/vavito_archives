import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CommentModerationStatus {
  VISIBLE = 'VISIBLE',
  HIDDEN = 'HIDDEN',
  SPAM = 'SPAM',
}

export class ModerateCommentDto {
  @ApiProperty({
    enum: CommentModerationStatus,
    enumName: 'CommentModerationStatus',
    example: CommentModerationStatus.HIDDEN,
  })
  @IsEnum(CommentModerationStatus)
  status!: CommentModerationStatus;

  @ApiPropertyOptional({ example: 'Conteúdo fora das regras da comunidade.', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
