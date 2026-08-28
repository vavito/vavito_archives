import { ApiProperty } from '@nestjs/swagger';

import { CommentStatus } from '@api/modules/comments/domain/enums/comment-status.enum';
import { PaginationMetaDto } from '@api/shared/pagination/dto/pagination-meta.dto';

export class CommentAuthorDto {
  @ApiProperty({ example: '019c2d62-6e90-7000-8000-000000000003', format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Leitor do Vavito' })
  displayName!: string;

  @ApiProperty({ example: 'https://cdn.example.com/avatars/leitor.webp', nullable: true })
  avatarUrl!: string | null;
}

export class CommentResponseDto {
  @ApiProperty({ example: '019c2d62-6e90-7000-8000-000000000040', format: 'uuid' })
  id!: string;

  @ApiProperty({ example: '019c2d62-6e90-7000-8000-000000000010', format: 'uuid' })
  postId!: string;

  @ApiProperty({ example: null, format: 'uuid', nullable: true })
  parentId!: string | null;

  @ApiProperty({ example: 'Excelente explicação sobre o tema.', nullable: true })
  content!: string | null;

  @ApiProperty({
    enum: [CommentStatus.VISIBLE, CommentStatus.DELETED],
    example: CommentStatus.VISIBLE,
  })
  status!: CommentStatus.VISIBLE | CommentStatus.DELETED;

  @ApiProperty({ nullable: true, type: () => CommentAuthorDto })
  author!: CommentAuthorDto | null;

  @ApiProperty({ example: false })
  edited!: boolean;

  @ApiProperty({ example: '2026-08-24T14:30:00.000Z', format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ example: null, format: 'date-time', nullable: true })
  editedAt!: string | null;

  @ApiProperty({ type: () => [CommentResponseDto] })
  replies!: CommentResponseDto[];
}

export class CommentAdminResponseDto {
  @ApiProperty({ example: '019c2d62-6e90-7000-8000-000000000040', format: 'uuid' })
  id!: string;

  @ApiProperty({ example: '019c2d62-6e90-7000-8000-000000000010', format: 'uuid' })
  postId!: string;

  @ApiProperty({ example: null, format: 'uuid', nullable: true })
  parentId!: string | null;

  @ApiProperty({ example: 'Conteúdo em análise pela moderação.', nullable: true })
  content!: string | null;

  @ApiProperty({ enum: CommentStatus, enumName: 'CommentStatus', example: CommentStatus.HIDDEN })
  status!: CommentStatus;

  @ApiProperty({ nullable: true, type: () => CommentAuthorDto })
  author!: CommentAuthorDto | null;

  @ApiProperty({ example: 'Conteúdo fora das regras da comunidade.', nullable: true })
  moderationReason!: string | null;

  @ApiProperty({ example: '2026-08-24T14:30:00.000Z', format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ example: null, format: 'date-time', nullable: true })
  editedAt!: string | null;

  @ApiProperty({ example: null, format: 'date-time', nullable: true })
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
