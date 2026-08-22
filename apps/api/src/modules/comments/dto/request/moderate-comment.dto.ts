import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CommentModerationStatus {
  VISIBLE = 'VISIBLE',
  HIDDEN = 'HIDDEN',
  SPAM = 'SPAM',
}

export class ModerateCommentDto {
  @ApiProperty({ enum: CommentModerationStatus, enumName: 'CommentModerationStatus' })
  @IsEnum(CommentModerationStatus)
  status!: CommentModerationStatus;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
