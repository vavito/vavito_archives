import { Logger } from '@nestjs/common';

import { ForbiddenAccessException } from '@api/core/auth/errors/forbidden-access.exception';
import type { ProfileAuthorizationRepository } from '@api/core/auth/repositories/profile-authorization.repository';
import type { MailService } from '@api/core/mail/services/mail.service';
import type { AvatarStorageService } from '@api/core/storage/services/avatar-storage.service';
import { ApplicationException } from '@api/core/http/exceptions/application.exception';
import { UserRole } from '@api/generated/prisma/client';
import { Comment } from '@api/modules/comments/domain/entities/comment.entity';
import { CommentStatus } from '@api/modules/comments/domain/enums/comment-status.enum';
import { CommentContent } from '@api/modules/comments/domain/value-objects/comment-content.value-object';
import { CommentModerationStatus } from '@api/modules/comments/dto/request/moderate-comment.dto';
import type {
  CommentRecord,
  CommentsRepository,
} from '@api/modules/comments/repositories/comments.repository';
import { CommentsService } from '@api/modules/comments/services/comments.service';
import { Post } from '@api/modules/posts/domain/entities/post.entity';
import { PostStatus } from '@api/modules/posts/domain/enums/post-status.enum';
import { PostContent } from '@api/modules/posts/domain/value-objects/post-content.value-object';
import { Slug } from '@api/modules/posts/domain/value-objects/slug.value-object';
import type {
  PostSlugLookupRecord,
  PostsRepository,
} from '@api/modules/posts/repositories/posts.repository';

const USER_ID = '3d46ab51-60b3-4604-a5f1-e2c403cb75f8';
const ADMIN_ID = '75170c59-cbed-4834-af9f-d1d23314ba7c';
const OTHER_ID = '67ea3c9d-62d6-46a8-8029-e377227001a1';
const POST_ID = '9de46532-a170-46c0-90dd-0b3cbf7794be';
const COMMENT_ID = 'df23c92d-71e4-400b-805e-975bbc3e1788';
const NOW = new Date('2026-08-22T12:00:00.000Z');

function publishedPost(): PostSlugLookupRecord {
  const post = Post.restore({
    archivedAt: null,
    authorId: ADMIN_ID,
    content: PostContent.create({ content: [], type: 'doc' }, 1),
    createdAt: NOW,
    currentSlug: Slug.create('artigo-publicado'),
    editedAt: null,
    excerpt: 'Resumo.',
    id: POST_ID,
    publishedAt: NOW,
    readingTimeMinutes: 1,
    seoDescription: null,
    seoTitle: null,
    status: PostStatus.PUBLISHED,
    title: 'Artigo publicado',
    updatedAt: NOW,
    viewsCount: 0,
  });

  return {
    author: { displayName: 'Admin', id: ADMIN_ID },
    cover: null,
    post,
    reactionCounts: { dislike: 0, like: 0 },
    requestedSlug: 'artigo-publicado',
    requestedSlugIsCurrent: true,
    tags: [],
  };
}

function record(comment: Comment, authorId: string = USER_ID): CommentRecord {
  return {
    author: { avatarPath: 'avatars/user.webp', displayName: 'Leitor', id: authorId },
    comment,
  };
}

function restoredComment(authorId: string = USER_ID, parentId: string | null = null): Comment {
  return Comment.restore({
    authorId,
    content: CommentContent.create('Comentário.'),
    createdAt: NOW,
    deletedAt: null,
    editedAt: null,
    id: COMMENT_ID,
    moderationReason: null,
    parentId,
    postId: POST_ID,
    status: CommentStatus.VISIBLE,
    updatedAt: NOW,
  });
}

describe('CommentsService', () => {
  const create = jest.fn();
  const findById = jest.fn();
  const findReplyParent = jest.fn();
  const listAdmin = jest.fn();
  const listPublicThreads = jest.fn();
  const save = jest.fn();
  const findBySlug = jest.fn();
  const findActiveRoleByProfileId = jest.fn();
  const publicUrl = jest.fn((path: string) => `https://storage.example/${path}`);
  const sendNewCommentNotification = jest.fn();
  const commentsRepository = {
    create,
    findById,
    findReplyParent,
    listAdmin,
    listPublicThreads,
    save,
  } as unknown as CommentsRepository;
  const postsRepository = { findBySlug } as unknown as PostsRepository;
  const authorizationRepository = {
    findActiveRoleByProfileId,
  } as unknown as ProfileAuthorizationRepository;
  const avatarStorage = { publicUrl } as unknown as AvatarStorageService;
  const mailService = { sendNewCommentNotification } as unknown as MailService;
  const service = new CommentsService(
    commentsRepository,
    postsRepository,
    authorizationRepository,
    avatarStorage,
    mailService,
  );
  let createdComment: Comment | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(NOW);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    findActiveRoleByProfileId.mockResolvedValue(UserRole.USER);
    findBySlug.mockResolvedValue(publishedPost());
    create.mockImplementation((comment: Comment) => {
      createdComment = comment;
      return Promise.resolve();
    });
    findById.mockImplementation(() =>
      Promise.resolve(createdComment ? record(createdComment) : null),
    );
    sendNewCommentNotification.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    createdComment = undefined;
  });

  it('persiste comentário visível antes de solicitar notificação', async () => {
    const response = await service.create(USER_ID, 'artigo-publicado', { content: 'Olá!' });

    expect(response).toMatchObject({ content: 'Olá!', status: CommentStatus.VISIBLE });
    expect(create).toHaveBeenCalledWith(createdComment);
    expect(sendNewCommentNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        authorId: USER_ID,
        commentId: createdComment?.id,
        postId: POST_ID,
        postSlug: 'artigo-publicado',
      }),
    );
    expect(create.mock.invocationCallOrder[0]).toBeLessThan(
      sendNewCommentNotification.mock.invocationCallOrder[0]!,
    );
  });

  it('mantém o comentário quando a notificação falha', async () => {
    sendNewCommentNotification.mockRejectedValueOnce(new Error('Resend indisponível'));

    await expect(
      service.create(USER_ID, 'artigo-publicado', { content: 'Olá!' }),
    ).resolves.toMatchObject({ status: CommentStatus.VISIBLE });
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('rejeita terceiro nível de comentários', async () => {
    findReplyParent.mockResolvedValueOnce(null);
    findById.mockResolvedValueOnce(record(restoredComment(USER_ID, OTHER_ID)));

    const result = service.create(USER_ID, 'artigo-publicado', {
      content: 'Resposta',
      parentId: COMMENT_ID,
    });
    await expect(result).rejects.toBeInstanceOf(ApplicationException);
    await expect(result).rejects.toMatchObject({ code: 'COMMENT_NESTING_LIMIT_EXCEEDED' });
    expect(create).not.toHaveBeenCalled();
  });

  it('lista threads públicas com avatar derivado do Storage', async () => {
    const root = restoredComment();
    listPublicThreads.mockResolvedValueOnce({
      items: [{ ...record(root), replies: [] }],
      total: 1,
    });

    await expect(service.listPublic('artigo-publicado', { limit: 20, page: 1 })).resolves.toEqual({
      items: [
        expect.objectContaining({
          author: {
            avatarUrl: 'https://storage.example/avatars/user.webp',
            displayName: 'Leitor',
            id: USER_ID,
          },
        }),
      ],
      meta: { limit: 20, page: 1, total: 1, totalPages: 1 },
    });
  });

  it('impede terceiro de editar comentário alheio', async () => {
    findById.mockResolvedValueOnce(record(restoredComment()));
    await expect(
      service.update(OTHER_ID, COMMENT_ID, { content: 'Alterado' }),
    ).rejects.toBeInstanceOf(ForbiddenAccessException);
    expect(save).not.toHaveBeenCalled();
  });

  it('permite que administrador aplique soft delete em comentário alheio', async () => {
    const comment = restoredComment();
    findById.mockResolvedValueOnce(record(comment));
    findActiveRoleByProfileId.mockResolvedValueOnce(UserRole.ADMIN);

    await service.delete(ADMIN_ID, COMMENT_ID);
    expect(comment.status).toBe(CommentStatus.DELETED);
    expect(save).toHaveBeenCalledWith(comment);
  });

  it('permite que administrador modere comentário', async () => {
    const comment = restoredComment();
    findById.mockResolvedValueOnce(record(comment));
    findActiveRoleByProfileId.mockResolvedValueOnce(UserRole.ADMIN);

    await expect(
      service.moderate(ADMIN_ID, COMMENT_ID, {
        reason: 'Abuso',
        status: CommentModerationStatus.SPAM,
      }),
    ).resolves.toMatchObject({ moderationReason: 'Abuso', status: CommentStatus.SPAM });
    expect(save).toHaveBeenCalledWith(comment);
  });
});
