import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { SupabaseAuthGuard } from '@api/core/auth/guards/supabase-auth.guard';
import { RolesGuard } from '@api/core/auth/guards/roles.guard';
import type { AuthenticatedUser } from '@api/core/auth/interfaces/authenticated-user.interface';
import { ProfileAuthorizationRepository } from '@api/core/auth/repositories/profile-authorization.repository';
import { SupabaseJwtService } from '@api/core/auth/services/supabase-jwt.service';
import { MailService } from '@api/core/mail/services/mail.service';
import { AvatarStorageService } from '@api/core/storage/services/avatar-storage.service';
import { setupErrorHandling } from '@api/core/http/setup-error-handling';
import { UserRole } from '@api/generated/prisma/client';
import { AdminCommentsController } from '@api/modules/comments/controllers/admin-comments.controller';
import { CommentsController } from '@api/modules/comments/controllers/comments.controller';
import { Comment } from '@api/modules/comments/domain/entities/comment.entity';
import { CommentStatus } from '@api/modules/comments/domain/enums/comment-status.enum';
import { CommentContent } from '@api/modules/comments/domain/value-objects/comment-content.value-object';
import { CommentModerationStatus } from '@api/modules/comments/dto/request/moderate-comment.dto';
import { CommentsRepository } from '@api/modules/comments/repositories/comments.repository';
import type {
  AdminCommentsFilters,
  CommentAuthorRecord,
  CommentRecord,
  PublicCommentsFilters,
} from '@api/modules/comments/repositories/comments.repository';
import { CommentsService } from '@api/modules/comments/services/comments.service';
import { Post } from '@api/modules/posts/domain/entities/post.entity';
import { PostStatus } from '@api/modules/posts/domain/enums/post-status.enum';
import { PostContent } from '@api/modules/posts/domain/value-objects/post-content.value-object';
import { Slug } from '@api/modules/posts/domain/value-objects/slug.value-object';
import { PostsRepository } from '@api/modules/posts/repositories/posts.repository';
import type { PostSlugLookupRecord } from '@api/modules/posts/repositories/posts.repository';

const OWNER: AuthenticatedUser = {
  email: 'dono@vavitoarchives.com.br',
  id: '2cc721a8-2db5-4e7f-b68a-d807546b5206',
};
const OTHER: AuthenticatedUser = {
  email: 'terceiro@vavitoarchives.com.br',
  id: '67ea3c9d-62d6-46a8-8029-e377227001a1',
};
const ADMIN: AuthenticatedUser = {
  email: 'admin@vavitoarchives.com.br',
  id: '75170c59-cbed-4834-af9f-d1d23314ba7c',
};
const POST_ID = '957c8388-cb96-4f0c-98b3-56b84c1fe67e';
const COMMENT_ID = 'df23c92d-71e4-400b-805e-975bbc3e1788';
const NOW = new Date('2026-08-24T10:00:00.000Z');

function bearer(token: 'owner' | 'other' | 'admin'): string {
  return `Bearer ${token}`;
}

function publishedPost(): PostSlugLookupRecord {
  return {
    author: { displayName: 'Admin', id: ADMIN.id },
    cover: null,
    post: Post.restore({
      archivedAt: null,
      authorId: ADMIN.id,
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
    }),
    reactionCounts: { dislike: 0, like: 0 },
    requestedSlug: 'artigo-publicado',
    requestedSlugIsCurrent: true,
    tags: [],
  };
}

function commentsFixture() {
  const comments = new Map<string, Comment>();
  const authors = new Map<string, CommentAuthorRecord>([
    [OWNER.id, { avatarPath: null, displayName: 'Dono', id: OWNER.id }],
    [OTHER.id, { avatarPath: null, displayName: 'Terceiro', id: OTHER.id }],
    [ADMIN.id, { avatarPath: null, displayName: 'Admin', id: ADMIN.id }],
  ]);
  const toRecord = (comment: Comment): CommentRecord => ({
    author: comment.authorId ? (authors.get(comment.authorId) ?? null) : null,
    comment,
  });
  const repository: CommentsRepository = {
    create: (comment: Comment) => {
      comments.set(comment.id, comment);
      return Promise.resolve();
    },
    findById: (id: string) => {
      const comment = comments.get(id);
      return Promise.resolve(comment ? toRecord(comment) : null);
    },
    findReplyParent: (parentId: string, postId: string) => {
      const comment = comments.get(parentId);
      return Promise.resolve(
        comment && comment.postId === postId && comment.parentId === null
          ? toRecord(comment)
          : null,
      );
    },
    listAdmin: (filters: AdminCommentsFilters) => {
      const items = [...comments.values()]
        .filter((comment) => !filters.postId || comment.postId === filters.postId)
        .filter((comment) => !filters.status || comment.status === filters.status)
        .map(toRecord);
      return Promise.resolve({ items, total: items.length });
    },
    listPublicThreads: (filters: PublicCommentsFilters) => {
      const roots = [...comments.values()].filter(
        (comment) =>
          comment.postId === filters.postId &&
          comment.parentId === null &&
          comment.status === CommentStatus.VISIBLE,
      );
      return Promise.resolve({
        items: roots.map((comment) => ({
          ...toRecord(comment),
          replies: [...comments.values()]
            .filter(
              (reply) => reply.parentId === comment.id && reply.status === CommentStatus.VISIBLE,
            )
            .map(toRecord),
        })),
        total: roots.length,
      });
    },
    save: (comment: Comment) => {
      comments.set(comment.id, comment);
      return Promise.resolve();
    },
  };

  return { comments, repository };
}

describe('Autorização de comentários por usuário (e2e)', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  const fixture = commentsFixture();
  const verify = jest.fn<Promise<AuthenticatedUser>, [string]>();
  const findActiveRoleByProfileId = jest.fn<Promise<UserRole | null>, [string]>();

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      controllers: [CommentsController, AdminCommentsController],
      providers: [
        SupabaseAuthGuard,
        RolesGuard,
        CommentsService,
        { provide: SupabaseJwtService, useValue: { verify } },
        {
          provide: ProfileAuthorizationRepository,
          useValue: { findActiveRoleByProfileId },
        },
        { provide: CommentsRepository, useValue: fixture.repository },
        {
          provide: PostsRepository,
          useValue: { findBySlug: () => Promise.resolve(publishedPost()) },
        },
        { provide: AvatarStorageService, useValue: { publicUrl: (path: string) => path } },
        {
          provide: MailService,
          useValue: { sendNewCommentNotification: () => Promise.resolve() },
        },
        { provide: APP_GUARD, useExisting: SupabaseAuthGuard },
        { provide: APP_GUARD, useExisting: RolesGuard },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    setupErrorHandling(app);
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    fixture.comments.clear();
    fixture.comments.set(
      COMMENT_ID,
      Comment.restore({
        authorId: OWNER.id,
        content: CommentContent.create('Comentário original.'),
        createdAt: NOW,
        deletedAt: null,
        editedAt: null,
        id: COMMENT_ID,
        moderationReason: null,
        parentId: null,
        postId: POST_ID,
        status: CommentStatus.VISIBLE,
        updatedAt: NOW,
      }),
    );
    verify.mockImplementation((token) => {
      if (token === 'owner') return Promise.resolve(OWNER);
      if (token === 'admin') return Promise.resolve(ADMIN);
      return Promise.resolve(OTHER);
    });
    findActiveRoleByProfileId.mockImplementation((id) =>
      Promise.resolve(id === ADMIN.id ? UserRole.ADMIN : UserRole.USER),
    );
  });

  afterAll(async () => {
    await app.close();
    await moduleRef.close();
  });

  it('publica comentário usando o usuário autenticado como autor', async () => {
    const response = await request(app.getHttpServer() as Server)
      .post('/posts/artigo-publicado/comments')
      .set('authorization', bearer('owner'))
      .send({ content: 'Novo comentário.' })
      .expect(201);

    expect(response.body).toMatchObject({
      author: { id: OWNER.id },
      content: 'Novo comentário.',
      status: CommentStatus.VISIBLE,
    });
    expect([...fixture.comments.values()]).toContainEqual(
      expect.objectContaining({ authorId: OWNER.id, postId: POST_ID }),
    );
  });

  it('permite edição ao dono e bloqueia o terceiro', async () => {
    const server = app.getHttpServer() as Server;

    await request(server)
      .patch(`/comments/${COMMENT_ID}`)
      .set('authorization', bearer('other'))
      .send({ content: 'Alteração indevida.' })
      .expect(403);
    const response = await request(server)
      .patch(`/comments/${COMMENT_ID}`)
      .set('authorization', bearer('owner'))
      .send({ content: 'Alteração do dono.' })
      .expect(200);

    expect(response.body).toMatchObject({ content: 'Alteração do dono.', edited: true });
    expect(fixture.comments.get(COMMENT_ID)?.content?.value).toBe('Alteração do dono.');
  });

  it('bloqueia exclusão pelo terceiro e permite intervenção administrativa', async () => {
    const server = app.getHttpServer() as Server;

    await request(server)
      .delete(`/comments/${COMMENT_ID}`)
      .set('authorization', bearer('other'))
      .expect(403);
    await request(server)
      .delete(`/comments/${COMMENT_ID}`)
      .set('authorization', bearer('admin'))
      .expect(204);

    expect(fixture.comments.get(COMMENT_ID)?.status).toBe(CommentStatus.DELETED);
  });

  it('restringe a moderação ao administrador', async () => {
    const server = app.getHttpServer() as Server;
    const body = { reason: 'Abuso', status: CommentModerationStatus.SPAM };

    await request(server)
      .patch(`/admin/comments/${COMMENT_ID}/status`)
      .set('authorization', bearer('owner'))
      .send(body)
      .expect(403);
    const response = await request(server)
      .patch(`/admin/comments/${COMMENT_ID}/status`)
      .set('authorization', bearer('admin'))
      .send(body)
      .expect(200);

    expect(response.body).toMatchObject({ moderationReason: 'Abuso', status: CommentStatus.SPAM });
  });
});
