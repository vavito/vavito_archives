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
import { setupErrorHandling } from '@api/core/http/setup-error-handling';
import { UserRole } from '@api/generated/prisma/client';
import { EngagementController } from '@api/modules/engagement/controllers/engagement.controller';
import type { Bookmark } from '@api/modules/engagement/domain/entities/bookmark.entity';
import type { Reaction } from '@api/modules/engagement/domain/entities/reaction.entity';
import { ReactionType } from '@api/modules/engagement/domain/enums/reaction-type.enum';
import { BookmarksRepository } from '@api/modules/engagement/repositories/bookmarks.repository';
import { ReactionsRepository } from '@api/modules/engagement/repositories/reactions.repository';
import { BookmarksService } from '@api/modules/engagement/services/bookmarks.service';
import { ReactionsService } from '@api/modules/engagement/services/reactions.service';
import type { PublicPostSummaryRecord } from '@api/modules/posts/repositories/posts.repository';

const OWNER: AuthenticatedUser = {
  email: 'dono@vavitoarchives.com.br',
  id: '2cc721a8-2db5-4e7f-b68a-d807546b5206',
};
const OTHER: AuthenticatedUser = {
  email: 'terceiro@vavitoarchives.com.br',
  id: '67ea3c9d-62d6-46a8-8029-e377227001a1',
};
const POST_ID = '957c8388-cb96-4f0c-98b3-56b84c1fe67e';
const POST_SUMMARY: PublicPostSummaryRecord = {
  cover: null,
  excerpt: 'Resumo publicado.',
  id: POST_ID,
  publishedAt: new Date('2026-08-24T10:00:00.000Z'),
  readingTimeMinutes: 4,
  slug: 'artigo-publicado',
  tags: [],
  title: 'Artigo publicado',
  viewsCount: 10,
};

function bearer(token: 'owner' | 'other'): string {
  return `Bearer ${token}`;
}

function engagementRepositories() {
  const reactions = new Map<string, Reaction>();
  const bookmarks = new Map<string, Bookmark>();
  const key = (profileId: string, postId: string) => `${profileId}:${postId}`;
  const reactionCounts = () => {
    const values = [...reactions.values()].filter((reaction) => reaction.postId === POST_ID);
    return {
      dislike: values.filter((reaction) => reaction.type === ReactionType.DISLIKE).length,
      like: values.filter((reaction) => reaction.type === ReactionType.LIKE).length,
    };
  };

  const reactionsRepository: ReactionsRepository = {
    remove: (profileId: string, postId: string) => {
      reactions.delete(key(profileId, postId));
      return Promise.resolve({ counts: reactionCounts(), postExists: true, reaction: null });
    },
    set: (reaction: Reaction) => {
      const existing = reactions.get(key(reaction.profileId, reaction.postId));
      if (existing) existing.changeType(reaction.type, reaction.updatedAt);
      else reactions.set(key(reaction.profileId, reaction.postId), reaction);

      return Promise.resolve({
        counts: reactionCounts(),
        postExists: true,
        reaction: reactions.get(key(reaction.profileId, reaction.postId)) ?? null,
      });
    },
  };
  const bookmarksRepository: BookmarksRepository = {
    list: ({ limit, page, profileId }: { limit: number; page: number; profileId: string }) => {
      const items = [...bookmarks.values()]
        .filter((bookmark) => bookmark.profileId === profileId)
        .map(() => POST_SUMMARY);
      return Promise.resolve({
        items: items.slice((page - 1) * limit, page * limit),
        total: items.length,
      });
    },
    remove: (profileId: string, postId: string) => {
      bookmarks.delete(key(profileId, postId));
      return Promise.resolve();
    },
    save: (bookmark: Bookmark) => {
      const bookmarkKey = key(bookmark.profileId, bookmark.postId);
      const persisted = bookmarks.get(bookmarkKey) ?? bookmark;
      bookmarks.set(bookmarkKey, persisted);
      return Promise.resolve({ bookmark: persisted, postExists: true });
    },
  };

  return { bookmarks, bookmarksRepository, reactions, reactionsRepository };
}

describe('Endpoints de Engagement por usuário (e2e)', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  const repositories = engagementRepositories();
  const verify = jest.fn<Promise<AuthenticatedUser>, [string]>();
  const findActiveRoleByProfileId = jest.fn<Promise<UserRole | null>, [string]>();

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      controllers: [EngagementController],
      providers: [
        SupabaseAuthGuard,
        RolesGuard,
        ReactionsService,
        BookmarksService,
        { provide: SupabaseJwtService, useValue: { verify } },
        {
          provide: ProfileAuthorizationRepository,
          useValue: { findActiveRoleByProfileId },
        },
        { provide: ReactionsRepository, useValue: repositories.reactionsRepository },
        { provide: BookmarksRepository, useValue: repositories.bookmarksRepository },
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
    repositories.reactions.clear();
    repositories.bookmarks.clear();
    verify.mockImplementation((token) => Promise.resolve(token === 'owner' ? OWNER : OTHER));
    findActiveRoleByProfileId.mockResolvedValue(UserRole.USER);
  });

  afterAll(async () => {
    await app.close();
    await moduleRef.close();
  });

  it('rejeita todas as operações sem autenticação', async () => {
    const server = app.getHttpServer() as Server;
    const requests = [
      () => request(server).put(`/posts/${POST_ID}/reaction`).send({ type: ReactionType.LIKE }),
      () => request(server).delete(`/posts/${POST_ID}/reaction`),
      () => request(server).get('/bookmarks'),
      () => request(server).put(`/posts/${POST_ID}/bookmark`),
      () => request(server).delete(`/posts/${POST_ID}/bookmark`),
    ];

    for (const createRequest of requests) await createRequest().expect(401);
    expect(repositories.reactions.size).toBe(0);
    expect(repositories.bookmarks.size).toBe(0);
  });

  it('isola a reação do dono contra remoção feita por terceiro', async () => {
    const server = app.getHttpServer() as Server;

    await request(server)
      .put(`/posts/${POST_ID}/reaction`)
      .set('authorization', bearer('owner'))
      .send({ type: ReactionType.LIKE })
      .expect(200);
    await request(server)
      .delete(`/posts/${POST_ID}/reaction`)
      .set('authorization', bearer('other'))
      .expect(204);

    expect([...repositories.reactions.values()]).toEqual([
      expect.objectContaining({ postId: POST_ID, profileId: OWNER.id, type: ReactionType.LIKE }),
    ]);
  });

  it('mantém bookmarks idempotentes e privados por usuário', async () => {
    const server = app.getHttpServer() as Server;

    await request(server)
      .put(`/posts/${POST_ID}/bookmark`)
      .set('authorization', bearer('owner'))
      .expect(200);
    await request(server)
      .put(`/posts/${POST_ID}/bookmark`)
      .set('authorization', bearer('owner'))
      .expect(200);
    await request(server)
      .delete(`/posts/${POST_ID}/bookmark`)
      .set('authorization', bearer('other'))
      .expect(204);
    const otherLibrary = await request(server)
      .get('/bookmarks')
      .set('authorization', bearer('other'))
      .expect(200);
    const ownerLibrary = await request(server)
      .get('/bookmarks')
      .set('authorization', bearer('owner'))
      .expect(200);

    expect(otherLibrary.body).toMatchObject({ items: [], meta: { total: 0 } });
    expect(ownerLibrary.body).toMatchObject({ items: [{ id: POST_ID }], meta: { total: 1 } });
    expect(repositories.bookmarks.size).toBe(1);
  });
});
