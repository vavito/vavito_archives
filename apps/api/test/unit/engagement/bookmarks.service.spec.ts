import { ForbiddenAccessException } from '@api/core/auth/errors/forbidden-access.exception';
import type { ProfileAuthorizationRepository } from '@api/core/auth/repositories/profile-authorization.repository';
import { UserRole } from '@api/generated/prisma/client';
import { Bookmark } from '@api/modules/engagement/domain/entities/bookmark.entity';
import type {
  BookmarkMutationResult,
  BookmarksFilters,
  BookmarksRepository,
} from '@api/modules/engagement/repositories/bookmarks.repository';
import { BookmarksService } from '@api/modules/engagement/services/bookmarks.service';
import { PostNotFoundException } from '@api/modules/posts/errors/post-not-found.exception';
import type {
  PaginatedRecords,
  PublicPostSummaryRecord,
} from '@api/modules/posts/repositories/posts.repository';

const PROFILE_ID = '3d46ab51-60b3-4604-a5f1-e2c403cb75f8';
const POST_ID = '9de46532-a170-46c0-90dd-0b3cbf7794be';
const CREATED_AT = new Date('2026-08-24T10:00:00.000Z');
const PUBLISHED_AT = new Date('2026-08-20T10:00:00.000Z');

function bookmark(): Bookmark {
  return Bookmark.create({
    id: 'df23c92d-71e4-400b-805e-975bbc3e1788',
    now: CREATED_AT,
    postId: POST_ID,
    profileId: PROFILE_ID,
  });
}

function postSummary(): PublicPostSummaryRecord {
  return {
    cover: null,
    excerpt: 'Resumo publicado.',
    id: POST_ID,
    publishedAt: PUBLISHED_AT,
    readingTimeMinutes: 4,
    slug: 'artigo-publicado',
    tags: [{ id: 'tag-id', name: 'NestJS', slug: 'nestjs' }],
    title: 'Artigo publicado',
    viewsCount: 12,
  };
}

describe('BookmarksService', () => {
  const save = jest.fn<Promise<BookmarkMutationResult>, [Bookmark]>();
  const remove = jest.fn<Promise<void>, [string, string]>();
  const list = jest.fn<Promise<PaginatedRecords<PublicPostSummaryRecord>>, [BookmarksFilters]>();
  const findActiveRoleByProfileId = jest.fn<Promise<UserRole | null>, [string]>();
  const repository = { list, remove, save } as unknown as BookmarksRepository;
  const authorizationRepository = {
    findActiveRoleByProfileId,
  } as unknown as ProfileAuthorizationRepository;
  const service = new BookmarksService(repository, authorizationRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    findActiveRoleByProfileId.mockResolvedValue(UserRole.USER);
  });

  it('salva o post para um perfil ativo', async () => {
    save.mockResolvedValue({ bookmark: bookmark(), postExists: true });

    await expect(service.save(PROFILE_ID, POST_ID)).resolves.toMatchObject({
      postId: POST_ID,
      profileId: PROFILE_ID,
    });
    expect(save.mock.calls[0]?.[0]).toMatchObject({ postId: POST_ID, profileId: PROFILE_ID });
  });

  it('não revela post ausente ou não publicado', async () => {
    save.mockResolvedValue({ bookmark: null, postExists: false });

    await expect(service.save(PROFILE_ID, POST_ID)).rejects.toBeInstanceOf(PostNotFoundException);
  });

  it('remove o bookmark do próprio perfil', async () => {
    remove.mockResolvedValue();

    await expect(service.remove(PROFILE_ID, POST_ID)).resolves.toBeUndefined();
    expect(remove).toHaveBeenCalledWith(PROFILE_ID, POST_ID);
  });

  it('lista a biblioteca privada com metadados de paginação', async () => {
    list.mockResolvedValue({ items: [postSummary()], total: 13 });

    await expect(service.list(PROFILE_ID, { limit: 12, page: 2 })).resolves.toEqual({
      items: [
        {
          coverAlt: null,
          coverUrl: null,
          excerpt: 'Resumo publicado.',
          id: POST_ID,
          publishedAt: PUBLISHED_AT.toISOString(),
          readingTimeMinutes: 4,
          slug: 'artigo-publicado',
          tags: [{ id: 'tag-id', name: 'NestJS', slug: 'nestjs' }],
          title: 'Artigo publicado',
          viewCount: 12,
        },
      ],
      meta: { limit: 12, page: 2, total: 13, totalPages: 2 },
    });
    expect(list).toHaveBeenCalledWith({ limit: 12, page: 2, profileId: PROFILE_ID });
  });

  it('rejeita perfil inexistente ou excluído antes da persistência', async () => {
    findActiveRoleByProfileId.mockResolvedValue(null);

    await expect(service.list(PROFILE_ID, { limit: 12, page: 1 })).rejects.toBeInstanceOf(
      ForbiddenAccessException,
    );
    expect(list).not.toHaveBeenCalled();
  });
});
