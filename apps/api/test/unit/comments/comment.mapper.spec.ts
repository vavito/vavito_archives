import { CommentStatus as PrismaCommentStatus } from '@api/generated/prisma/client';
import { Comment } from '@api/modules/comments/domain/entities/comment.entity';
import { CommentStatus } from '@api/modules/comments/domain/enums/comment-status.enum';
import { CommentContent } from '@api/modules/comments/domain/value-objects/comment-content.value-object';
import { CommentMapper } from '@api/modules/comments/mappers/comment.mapper';

const COMMENT_ID = 'df23c92d-71e4-400b-805e-975bbc3e1788';
const POST_ID = '9de46532-a170-46c0-90dd-0b3cbf7794be';
const AUTHOR_ID = '3d46ab51-60b3-4604-a5f1-e2c403cb75f8';
const CREATED_AT = new Date('2026-08-22T10:00:00.000Z');

describe('CommentMapper', () => {
  it('converte comentário visível para persistência Prisma', () => {
    const comment = Comment.create({
      authorId: AUTHOR_ID,
      content: CommentContent.create('Comentário válido.'),
      id: COMMENT_ID,
      now: CREATED_AT,
      postId: POST_ID,
    });

    expect(CommentMapper.toPersistence(comment)).toEqual({
      authorId: AUTHOR_ID,
      content: 'Comentário válido.',
      createdAt: CREATED_AT,
      deletedAt: null,
      editedAt: null,
      id: COMMENT_ID,
      moderationReason: null,
      parentId: null,
      postId: POST_ID,
      status: PrismaCommentStatus.VISIBLE,
      updatedAt: CREATED_AT,
    });
  });

  it('restaura comentário deletado e anonimizado', () => {
    const deletedAt = new Date('2026-08-22T11:00:00.000Z');
    const comment = CommentMapper.toDomain({
      authorId: null,
      content: null,
      createdAt: CREATED_AT,
      deletedAt,
      editedAt: null,
      id: COMMENT_ID,
      moderationReason: null,
      parentId: null,
      postId: POST_ID,
      status: PrismaCommentStatus.DELETED,
      updatedAt: deletedAt,
    });

    expect(comment.authorId).toBeNull();
    expect(comment.content).toBeNull();
    expect(comment.status).toBe(CommentStatus.DELETED);
    expect(comment.deletedAt).toEqual(deletedAt);
  });

  it('mapeia somente campos mutáveis na atualização', () => {
    const comment = Comment.create({
      authorId: AUTHOR_ID,
      content: CommentContent.create('Comentário válido.'),
      id: COMMENT_ID,
      now: CREATED_AT,
      postId: POST_ID,
    });
    const hiddenAt = new Date('2026-08-22T11:00:00.000Z');
    comment.hide(hiddenAt, 'Moderação');

    expect(CommentMapper.toUpdate(comment)).toEqual({
      content: 'Comentário válido.',
      deletedAt: null,
      editedAt: null,
      moderationReason: 'Moderação',
      status: PrismaCommentStatus.HIDDEN,
      updatedAt: hiddenAt,
    });
  });
});
