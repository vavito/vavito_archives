import { Comment } from '@api/modules/comments/domain/entities/comment.entity';
import { CommentStatus } from '@api/modules/comments/domain/enums/comment-status.enum';
import { CommentAlreadyDeletedError } from '@api/modules/comments/domain/errors/comment-already-deleted.error';
import { CommentEditNotAllowedError } from '@api/modules/comments/domain/errors/comment-edit-not-allowed.error';
import { InvalidCommentStatusTransitionError } from '@api/modules/comments/domain/errors/invalid-comment-status-transition.error';
import { CommentContent } from '@api/modules/comments/domain/value-objects/comment-content.value-object';

const CREATED_AT = new Date('2026-08-22T10:00:00.000Z');
const COMMENT_ID = 'df23c92d-71e4-400b-805e-975bbc3e1788';
const POST_ID = '9de46532-a170-46c0-90dd-0b3cbf7794be';
const AUTHOR_ID = '3d46ab51-60b3-4604-a5f1-e2c403cb75f8';

function createComment(): Comment {
  return Comment.create({
    authorId: AUTHOR_ID,
    content: CommentContent.create('Comentário original.'),
    id: COMMENT_ID,
    now: CREATED_AT,
    postId: POST_ID,
  });
}

function restoreComment(status: CommentStatus): Comment {
  const deleted = status === CommentStatus.DELETED;

  return Comment.restore({
    authorId: AUTHOR_ID,
    content: deleted ? null : CommentContent.create('Comentário original.'),
    createdAt: CREATED_AT,
    deletedAt: deleted ? new Date('2026-08-22T11:00:00.000Z') : null,
    editedAt: null,
    id: COMMENT_ID,
    moderationReason: status === CommentStatus.VISIBLE ? null : 'Moderação',
    parentId: null,
    postId: POST_ID,
    status,
    updatedAt: new Date('2026-08-22T11:00:00.000Z'),
  });
}

describe('Comment', () => {
  it('cria comentário imediatamente visível e sem datas de edição ou exclusão', () => {
    const comment = createComment();

    expect(comment.status).toBe(CommentStatus.VISIBLE);
    expect(comment.content?.value).toBe('Comentário original.');
    expect(comment.editedAt).toBeNull();
    expect(comment.deletedAt).toBeNull();
    expect(comment.moderationReason).toBeNull();
    expect(comment.createdAt).toEqual(CREATED_AT);
    expect(comment.updatedAt).toEqual(CREATED_AT);
  });

  it('edita comentário visível e registra editedAt', () => {
    const comment = createComment();
    const editedAt = new Date('2026-08-22T11:00:00.000Z');

    comment.edit(CommentContent.create('Conteúdo editado.'), editedAt);

    expect(comment.content?.value).toBe('Conteúdo editado.');
    expect(comment.editedAt).toEqual(editedAt);
    expect(comment.updatedAt).toEqual(editedAt);
  });

  it.each([CommentStatus.HIDDEN, CommentStatus.SPAM])(
    'rejeita edição quando o comentário está em %s',
    (status) => {
      const comment = restoreComment(status);

      expect(() => comment.edit(CommentContent.create('Edição.'), new Date())).toThrow(
        CommentEditNotAllowedError,
      );
      expect(comment.content?.value).toBe('Comentário original.');
    },
  );

  it.each([CommentStatus.HIDDEN, CommentStatus.SPAM])(
    'restaura comentário em %s para visível',
    (status) => {
      const comment = restoreComment(status);
      const approvedAt = new Date('2026-08-22T12:00:00.000Z');

      comment.approve(approvedAt);

      expect(comment.status).toBe(CommentStatus.VISIBLE);
      expect(comment.moderationReason).toBeNull();
      expect(comment.updatedAt).toEqual(approvedAt);
    },
  );

  it.each([CommentStatus.VISIBLE, CommentStatus.SPAM])(
    'oculta comentário em %s e normaliza o motivo',
    (status) => {
      const comment = restoreComment(status);

      comment.hide(new Date('2026-08-22T12:00:00.000Z'), '  Fora das regras  ');

      expect(comment.status).toBe(CommentStatus.HIDDEN);
      expect(comment.moderationReason).toBe('Fora das regras');
    },
  );

  it.each([CommentStatus.VISIBLE, CommentStatus.HIDDEN])(
    'marca comentário em %s como spam',
    (status) => {
      const comment = restoreComment(status);

      comment.markAsSpam(new Date('2026-08-22T12:00:00.000Z'), 'Abuso');

      expect(comment.status).toBe(CommentStatus.SPAM);
      expect(comment.moderationReason).toBe('Abuso');
    },
  );

  it.each([CommentStatus.VISIBLE, CommentStatus.HIDDEN, CommentStatus.SPAM])(
    'aplica soft delete ao comentário em %s e preserva a linha',
    (status) => {
      const comment = restoreComment(status);
      const deletedAt = new Date('2026-08-22T12:00:00.000Z');

      comment.softDelete(deletedAt);

      expect(comment.status).toBe(CommentStatus.DELETED);
      expect(comment.content).toBeNull();
      expect(comment.deletedAt).toEqual(deletedAt);
      expect(comment.updatedAt).toEqual(deletedAt);
    },
  );

  it.each([
    ['aprovar', CommentStatus.VISIBLE, (comment: Comment) => comment.approve(new Date())],
    ['ocultar', CommentStatus.HIDDEN, (comment: Comment) => comment.hide(new Date())],
    ['marcar como spam', CommentStatus.SPAM, (comment: Comment) => comment.markAsSpam(new Date())],
  ] as const)('rejeita %s quando o comentário está em %s', (_action, status, transition) => {
    const comment = restoreComment(status);

    expect(() => transition(comment)).toThrow(InvalidCommentStatusTransitionError);
    expect(comment.status).toBe(status);
  });

  it('impede qualquer ação em comentário deletado', () => {
    const comment = restoreComment(CommentStatus.DELETED);
    const content = CommentContent.create('Novo conteúdo.');

    expect(() => comment.edit(content, new Date())).toThrow(CommentAlreadyDeletedError);
    expect(() => comment.approve(new Date())).toThrow(CommentAlreadyDeletedError);
    expect(() => comment.hide(new Date())).toThrow(CommentAlreadyDeletedError);
    expect(() => comment.markAsSpam(new Date())).toThrow(CommentAlreadyDeletedError);
    expect(() => comment.softDelete(new Date())).toThrow(CommentAlreadyDeletedError);
  });

  it('protege datas contra mutação externa', () => {
    const createdAt = new Date(CREATED_AT);
    const comment = Comment.create({
      authorId: AUTHOR_ID,
      content: CommentContent.create('Comentário.'),
      id: COMMENT_ID,
      now: createdAt,
      postId: POST_ID,
    });

    createdAt.setUTCFullYear(2030);
    const returnedCreatedAt = comment.createdAt;
    returnedCreatedAt.setUTCFullYear(2031);

    expect(comment.createdAt).toEqual(CREATED_AT);
  });
});
