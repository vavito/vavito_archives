import { ApiProperty } from '@nestjs/swagger';

import { CommentStatus } from '@api/modules/comments/domain/enums/comment-status.enum';
import { PaginationMetaDto } from '@api/shared/pagination/dto/pagination-meta.dto';

export class CommentAuthorDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  displayName!: string;

  @ApiProperty({ nullable: true })
  avatarUrl!: string | null;
}

export class CommentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  postId!: string;

  @ApiProperty({ format: 'uuid', nullable: true })
  parentId!: string | null;

  @ApiProperty({ nullable: true })
  content!: string | null;

  @ApiProperty({ enum: [CommentStatus.VISIBLE, CommentStatus.DELETED] })
  status!: CommentStatus.VISIBLE | CommentStatus.DELETED;

  @ApiProperty({ nullable: true, type: () => CommentAuthorDto })
  author!: CommentAuthorDto | null;

  @ApiProperty()
  edited!: boolean;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time', nullable: true })
  editedAt!: string | null;

  @ApiProperty({ type: () => [CommentResponseDto] })
  replies!: CommentResponseDto[];
}

export class CommentAdminResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  postId!: string;

  @ApiProperty({ format: 'uuid', nullable: true })
  parentId!: string | null;

  @ApiProperty({ nullable: true })
  content!: string | null;

  @ApiProperty({ enum: CommentStatus, enumName: 'CommentStatus' })
  status!: CommentStatus;

  @ApiProperty({ nullable: true, type: () => CommentAuthorDto })
  author!: CommentAuthorDto | null;

  @ApiProperty({ nullable: true })
  moderationReason!: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time', nullable: true })
  editedAt!: string | null;

  @ApiProperty({ format: 'date-time', nullable: true })
  deletedAt!: string | null;
}

export class PaginatedCommentsResponseDto {
  @ApiProperty({ type: () => [CommentResponseDto] })
  items!: CommentResponseDto[];

  @ApiProperty({ type: () => PaginationMetaDto })
  meta!: PaginationMetaDto;
}

export class PaginatedAdminCommentsResponseDto {
  @ApiProperty({ type: () => [CommentAdminResponseDto] })
  items!: CommentAdminResponseDto[];

  @ApiProperty({ type: () => PaginationMetaDto })
  meta!: PaginationMetaDto;
}
