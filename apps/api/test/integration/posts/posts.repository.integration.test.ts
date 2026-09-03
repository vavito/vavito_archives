import { randomUUID } from 'node:crypto';

import type { ConfigService } from '@nestjs/config';

import type { ApplicationConfig } from '@api/core/config/app.config';
import { PrismaService } from '@api/core/database/prisma.service';
import {
  MediaAssetStatus,
  MediaUsageType,
  ReactionType,
  UserRole,
} from '@api/generated/prisma/client';
import { Prisma } from '@api/generated/prisma/client';
import { Post } from '@api/modules/posts/domain/entities/post.entity';
import { PostStatus } from '@api/modules/posts/domain/enums/post-status.enum';
import { PostContent } from '@api/modules/posts/domain/value-objects/post-content.value-object';
import { Slug } from '@api/modules/posts/domain/value-objects/slug.value-object';
import { PrismaPostsRepository } from '@api/modules/posts/repositories/prisma-posts.repository';

import { requireIntegrationDatabaseUrl } from '../../helpers/database-url';

const connectionString = requireIntegrationDatabaseUrl();
const content = PostContent.create(
  {
    content: [{ content: [{ text: 'Conteúdo de integração', type: 'text' }], type: 'paragraph' }],
    type: 'doc',
  },
  1,
);

interface TestRecords {
  mediaAssetIds: string[];
  postIds: string[];
  profileIds: string[];
  tagNames: string[];
}

interface PostFixtureOverrides {
  content?: PostContent;
  createdAt?: Date;
  currentSlug?: string | null;
  editedAt?: Date | null;
  excerpt?: string | null;
  id?: string;
  publishedAt?: Date | null;
  status?: PostStatus;
  title?: string;
  updatedAt?: Date;
  viewsCount?: number;
}

let prisma: PrismaService;
let records: TestRecords;
let repository: PrismaPostsRepository;

function buildPost(authorId: string, overrides: PostFixtureOverrides = {}): Post {
  const now = overrides.createdAt ?? new Date('2026-08-17T12:00:00.000Z');
  const status = overrides.status ?? PostStatus.PUBLISHED;
  const currentSlug =
    overrides.currentSlug === undefined ? `post-${randomUUID()}` : overrides.currentSlug;

  return Post.restore({
    archivedAt: status === PostStatus.ARCHIVED ? now : null,
    authorId,
    content: overrides.content ?? content,
    createdAt: now,
    currentSlug: currentSlug ? Slug.create(currentSlug) : null,
    editedAt: overrides.editedAt ?? null,
    excerpt: overrides.excerpt === undefined ? 'Resumo para os testes.' : overrides.excerpt,
    id: overrides.id ?? randomUUID(),
    publishedAt:
      overrides.publishedAt === undefined
        ? status === PostStatus.PUBLISHED
          ? now
          : null
        : overrides.publishedAt,
    readingTimeMinutes: 3,
    seoDescription: 'Descrição para busca.',
    seoTitle: 'Título para SEO',
    status,
    title: overrides.title ?? 'Post de integração',
    updatedAt: overrides.updatedAt ?? now,
    viewsCount: overrides.viewsCount ?? 0,
  });
}

async function createAuthor(displayName = 'Autor da integração'): Promise<string> {
  const id = randomUUID();

  await prisma.profile.create({ data: { displayName, id, role: UserRole.ADMIN } });
  records.profileIds.push(id);

  return id;
}

async function createPost(post: Post): Promise<void> {
  await repository.create(post);
  records.postIds.push(post.id);
}

describe('PrismaPostsRepository com PostgreSQL real', () => {
  beforeAll(async () => {
    const configService = {
      get: jest.fn((path: string) => {
        if (path === 'database.connectOnStart') {
          return true;
        }
        if (path === 'database.url') {
          return connectionString;
        }

        throw new Error(`Configuração inesperada no teste: ${path}`);
      }),
    } as unknown as ConfigService<ApplicationConfig, true>;

    prisma = new PrismaService(configService);
    repository = new PrismaPostsRepository(prisma);
    await prisma.onModuleInit();
  });

  beforeEach(() => {
    records = { mediaAssetIds: [], postIds: [], profileIds: [], tagNames: [] };
  });

  afterEach(async () => {
    await prisma.post.deleteMany({ where: { id: { in: records.postIds } } });
    await prisma.mediaAsset.deleteMany({ where: { id: { in: records.mediaAssetIds } } });
    await prisma.tag.deleteMany({ where: { name: { in: records.tagNames } } });
    await prisma.profile.deleteMany({ where: { id: { in: records.profileIds } } });
  });

  afterAll(async () => {
    await prisma.onModuleDestroy();
  });

  it('cria, atualiza, consulta e remove um post preservando o histórico de slug', async () => {
    const authorId = await createAuthor();
    const post = buildPost(authorId, { currentSlug: 'slug-original' });
    await createPost(post);

    await expect(repository.findById(post.id)).resolves.toMatchObject({
      author: { displayName: 'Autor da integração', id: authorId },
      post: { id: post.id, title: 'Post de integração' },
    });

    const editedAt = new Date('2026-08-17T13:00:00.000Z');
    const updated = buildPost(authorId, {
      createdAt: post.createdAt,
      currentSlug: 'slug-atualizado',
      editedAt,
      id: post.id,
      publishedAt: post.publishedAt,
      title: 'Post atualizado',
      updatedAt: editedAt,
    });
    await repository.update(updated);

    await prisma.reaction.create({
      data: { postId: post.id, profileId: authorId, type: ReactionType.LIKE },
    });
    await prisma.bookmark.create({ data: { postId: post.id, profileId: authorId } });

    await expect(repository.findBySlug('slug-original')).resolves.toMatchObject({
      post: { id: post.id, title: 'Post atualizado' },
      requestedSlug: 'slug-original',
      requestedSlugIsCurrent: false,
      viewer: null,
    });
    await expect(repository.findBySlug('slug-atualizado', authorId)).resolves.toMatchObject({
      post: { id: post.id },
      requestedSlugIsCurrent: true,
      viewer: { bookmarked: true, reaction: ReactionType.LIKE },
    });
    await expect(repository.findSlugOwner('slug-original')).resolves.toEqual({
      isCurrent: false,
      postId: post.id,
    });

    await repository.delete(post.id);
    await expect(repository.findById(post.id)).resolves.toBeNull();
  });

  it('carrega somente a referência publicada necessária para integrações internas', async () => {
    const authorId = await createAuthor();
    const post = buildPost(authorId, {
      currentSlug: 'referencia-publicada',
      title: 'Referência publicada',
    });
    await createPost(post);

    const expectedReference = {
      excerpt: 'Resumo para os testes.',
      id: post.id,
      publishedAt: post.publishedAt,
      readingTimeMinutes: 3,
      slug: 'referencia-publicada',
      title: 'Referência publicada',
    };

    await expect(repository.findPublishedReferenceById(post.id)).resolves.toEqual(
      expectedReference,
    );
    await expect(repository.findPublishedReferenceBySlug('referencia-publicada')).resolves.toEqual(
      expectedReference,
    );
  });

  it('lista apenas posts publicados com filtro, paginação, ordem estável e relações necessárias', async () => {
    const authorId = await createAuthor('Autora pública');
    const publishedAt = new Date('2026-08-16T12:00:00.000Z');
    const first = buildPost(authorId, {
      currentSlug: 'primeiro-post-publico',
      id: '00000000-0000-4000-8000-000000000001',
      publishedAt,
      title: 'Primeiro post',
      viewsCount: 20,
    });
    const second = buildPost(authorId, {
      currentSlug: 'segundo-post-publico',
      id: '00000000-0000-4000-8000-000000000002',
      publishedAt,
      title: 'Segundo post',
      viewsCount: 20,
    });
    const draft = buildPost(authorId, {
      currentSlug: 'rascunho-privado',
      id: '00000000-0000-4000-8000-000000000003',
      status: PostStatus.DRAFT,
      title: 'Rascunho',
    });
    await createPost(first);
    await createPost(second);
    await createPost(draft);

    const suffix = randomUUID();
    const architecture = { name: `Arquitetura ${suffix}`, slug: `arquitetura-${suffix}` };
    const typescript = { name: `TypeScript ${suffix}`, slug: `typescript-${suffix}` };
    records.tagNames.push(architecture.name, typescript.name);
    await repository.replaceTags(first.id, [typescript, architecture]);
    await repository.replaceTags(second.id, [typescript]);
    await repository.replaceTags(draft.id, [architecture]);

    const mediaAssetId = randomUUID();
    records.mediaAssetIds.push(mediaAssetId);
    await prisma.mediaAsset.create({
      data: {
        altText: 'Capa do primeiro post',
        createdById: authorId,
        id: mediaAssetId,
        mimeType: 'image/webp',
        sizeBytes: 1024n,
        status: MediaAssetStatus.READY,
        storagePath: `posts/${first.id}/cover.webp`,
      },
    });
    await prisma.postMediaAsset.create({
      data: { mediaAssetId, postId: first.id, usage: MediaUsageType.COVER },
    });

    const page = await repository.listPublic({ limit: 1, page: 1, sort: 'popular' });
    const filtered = await repository.listPublic({
      limit: 10,
      page: 1,
      sort: 'recent',
      tag: architecture.slug,
    });

    expect(page).toMatchObject({ items: [{ id: first.id }], total: 2 });
    expect(filtered.total).toBe(1);
    expect(filtered.items[0]).toMatchObject({
      cover: {
        altText: 'Capa do primeiro post',
        id: mediaAssetId,
        storagePath: `posts/${first.id}/cover.webp`,
      },
      id: first.id,
      tags: [
        { name: architecture.name, slug: architecture.slug },
        { name: typescript.name, slug: typescript.slug },
      ],
    });
    expect(filtered.items[0]).not.toHaveProperty('content');

    const listedTags = await repository.listTags();
    expect(listedTags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: architecture.name, publishedPostCount: 1 }),
        expect.objectContaining({ name: typescript.name, publishedPostCount: 2 }),
      ]),
    );
  });

  it('substitui associações de tags sem duplicar nem manter vínculos removidos', async () => {
    const authorId = await createAuthor();
    const post = buildPost(authorId);
    await createPost(post);
    const suffix = randomUUID();
    const first = { name: `Primeira ${suffix}`, slug: `primeira-${suffix}` };
    const second = { name: `Segunda ${suffix}`, slug: `segunda-${suffix}` };
    records.tagNames.push(first.name, second.name);

    await repository.replaceTags(post.id, [first, second]);
    await repository.replaceTags(post.id, [second, second]);

    const associations = await prisma.postTag.findMany({
      select: { tag: { select: { name: true } } },
      where: { postId: post.id },
    });

    expect(associations).toEqual([{ tag: { name: second.name } }]);
  });

  it('filtra a visão administrativa por status e termo mantendo a ordenação estável', async () => {
    const authorId = await createAuthor();
    const updatedAt = new Date('2026-08-17T15:00:00.000Z');
    const first = buildPost(authorId, {
      currentSlug: 'rascunho-especial-a',
      id: '00000000-0000-4000-8000-000000000011',
      status: PostStatus.DRAFT,
      title: 'Rascunho alfa',
      updatedAt,
    });
    const second = buildPost(authorId, {
      currentSlug: 'rascunho-especial-b',
      id: '00000000-0000-4000-8000-000000000012',
      status: PostStatus.DRAFT,
      title: 'Rascunho beta',
      updatedAt,
    });
    const published = buildPost(authorId, {
      currentSlug: 'publicado-especial',
      id: '00000000-0000-4000-8000-000000000013',
      status: PostStatus.PUBLISHED,
      title: 'Publicado',
      updatedAt,
    });
    await createPost(first);
    await createPost(second);
    await createPost(published);

    const result = await repository.listAdmin({
      limit: 1,
      page: 2,
      q: 'ESPECIAL',
      status: PostStatus.DRAFT,
    });

    expect(result.total).toBe(2);
    expect(result.items).toEqual([
      expect.objectContaining({ id: second.id, status: PostStatus.DRAFT }),
    ]);
    expect(result.items[0]).not.toHaveProperty('content');
  });

  it('busca somente posts publicados por título, resumo e tag', async () => {
    const authorId = await createAuthor('Autora da busca');
    const searchToken = `postgresql${randomUUID().replaceAll('-', '')}`;
    const titleMatch = buildPost(authorId, {
      currentSlug: `${searchToken}-titulo`,
      excerpt: 'Resumo sem o termo principal.',
      title: `${searchToken} para aplicações web`,
    });
    const excerptMatch = buildPost(authorId, {
      currentSlug: `${searchToken}-resumo`,
      excerpt: `Uma introdução prática ao ${searchToken}.`,
      title: 'Banco de dados relacional',
    });
    const tagMatch = buildPost(authorId, {
      currentSlug: `${searchToken}-tag`,
      excerpt: 'Resumo sem o termo principal.',
      title: 'Persistência moderna',
    });
    const draftMatch = buildPost(authorId, {
      currentSlug: `${searchToken}-rascunho`,
      status: PostStatus.DRAFT,
      title: 'PostgreSQL ainda privado',
    });
    await createPost(titleMatch);
    await createPost(excerptMatch);
    await createPost(tagMatch);
    await createPost(draftMatch);

    const tag = { name: searchToken, slug: searchToken };
    records.tagNames.push(tag.name);
    await repository.replaceTags(tagMatch.id, [tag]);

    const results = await repository.searchPublic(searchToken, 8);

    expect(results.map(({ id }) => id)).toEqual([titleMatch.id, tagMatch.id, excerptMatch.id]);
    expect(results.map(({ id }) => id)).not.toContain(draftMatch.id);
    expect(results.every((result) => !('content' in result))).toBe(true);
  });

  it('limita a busca e mantém desempate estável por publicação e id', async () => {
    const authorId = await createAuthor('Autor do limite');
    const publishedAt = new Date('2026-08-18T12:00:00.000Z');
    const searchToken = `limite${randomUUID().replaceAll('-', '')}`;
    const posts = Array.from({ length: 9 }, (_, index) =>
      buildPost(authorId, {
        currentSlug: `${searchToken}-${index}`,
        id: `10000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
        publishedAt,
        title: searchToken,
      }),
    );
    await Promise.all(posts.map(createPost));

    const results = await repository.searchPublic(searchToken, 8);

    expect(results).toHaveLength(8);
    expect(results.map(({ id }) => id)).toEqual(posts.slice(0, 8).map(({ id }) => id));
  });

  it('mantém o índice trigram disponível e explica o plano da busca publicada', async () => {
    const indexes = await prisma.$queryRaw<Array<{ indexdef: string; indexname: string }>>`
      SELECT "indexname", "indexdef"
      FROM "pg_indexes"
      WHERE
        "schemaname" = 'public'
        AND "tablename" = 'Post'
        AND "indexname" = 'Post_published_title_trgm_idx'
    `;
    const plan = await prisma.$transaction(async (transaction) => {
      await transaction.$executeRaw`SET LOCAL enable_seqscan = off`;

      return transaction.$queryRaw<Array<{ 'QUERY PLAN': unknown }>>(Prisma.sql`
        EXPLAIN (FORMAT JSON)
        SELECT "id"
        FROM "Post"
        WHERE
          "status" = 'PUBLISHED'::"PostStatus"
          AND lower("title") LIKE '%postgresql%' ESCAPE '\'
      `);
    });

    expect(indexes).toHaveLength(1);
    expect(indexes[0]?.indexname).toBe('Post_published_title_trgm_idx');
    expect(indexes[0]?.indexdef).toContain('USING gin');
    expect(indexes[0]?.indexdef).toContain('gin_trgm_ops');
    expect(JSON.stringify(plan)).toMatch(/(?:Index|Bitmap).*Scan/);
  });

  it('deduplica views concorrentes e atualiza o ranking somente para posts publicados', async () => {
    const authorId = await createAuthor('Autor das visualizações');
    const mostViewed = buildPost(authorId, {
      currentSlug: `mais-visto-${randomUUID()}`,
      title: 'Post mais visto',
    });
    const lessViewed = buildPost(authorId, {
      currentSlug: `menos-visto-${randomUUID()}`,
      title: 'Post menos visto',
    });
    const draft = buildPost(authorId, {
      currentSlug: `rascunho-view-${randomUUID()}`,
      status: PostStatus.DRAFT,
      title: 'Rascunho sem visualizações',
    });
    await createPost(mostViewed);
    await createPost(lessViewed);
    await createPost(draft);

    const duplicatedAttempts = await Promise.all([
      repository.registerView(mostViewed.currentSlug!.value, {
        bucketDate: '2026-08-19',
        fingerprintHash: 'same-daily-fingerprint',
        id: randomUUID(),
      }),
      repository.registerView(mostViewed.currentSlug!.value, {
        bucketDate: '2026-08-19',
        fingerprintHash: 'same-daily-fingerprint',
        id: randomUUID(),
      }),
    ]);
    await repository.registerView(mostViewed.currentSlug!.value, {
      bucketDate: '2026-08-19',
      fingerprintHash: 'another-daily-fingerprint',
      id: randomUUID(),
    });
    await repository.registerView(lessViewed.currentSlug!.value, {
      bucketDate: '2026-08-19',
      fingerprintHash: 'less-viewed-fingerprint',
      id: randomUUID(),
    });
    const draftResult = await repository.registerView(draft.currentSlug!.value, {
      bucketDate: '2026-08-19',
      fingerprintHash: 'draft-fingerprint',
      id: randomUUID(),
    });

    const ranking = await repository.listPublic({ limit: 10, page: 1, sort: 'popular' });
    const persistedViews = await prisma.postView.count({ where: { postId: mostViewed.id } });

    expect(duplicatedAttempts.filter(({ counted }) => counted)).toHaveLength(1);
    expect(draftResult).toEqual({ counted: false, postExists: false });
    expect(persistedViews).toBe(2);
    expect(ranking.items.slice(0, 2).map(({ id }) => id)).toEqual([mostViewed.id, lessViewed.id]);
    expect(ranking.items.slice(0, 2).map(({ viewsCount }) => viewsCount)).toEqual([2, 1]);
  });

  it('salva revisão anterior, post e tags na mesma transação', async () => {
    const authorId = await createAuthor();
    const original = buildPost(authorId, {
      currentSlug: 'post-antes-da-revisao',
      title: 'Título anterior',
    });
    await createPost(original);
    const oldTag = { name: `Tag antiga ${randomUUID()}`, slug: `tag-antiga-${randomUUID()}` };
    const newTag = { name: `Tag nova ${randomUUID()}`, slug: `tag-nova-${randomUUID()}` };
    records.tagNames.push(oldTag.name, newTag.name);
    await repository.replaceTags(original.id, [oldTag]);

    const editedAt = new Date('2026-08-17T18:00:00.000Z');
    const updatedContent = PostContent.create(
      {
        content: [{ content: [{ text: 'Conteúdo revisado', type: 'text' }], type: 'paragraph' }],
        type: 'doc',
      },
      1,
    );
    const updated = buildPost(authorId, {
      content: updatedContent,
      createdAt: original.createdAt,
      currentSlug: 'post-depois-da-revisao',
      editedAt,
      id: original.id,
      publishedAt: original.publishedAt,
      title: 'Título revisado',
      updatedAt: editedAt,
    });

    await repository.update(updated, {
      revision: { createdAt: editedAt, editorId: authorId },
      tags: [newTag],
    });

    const persisted = await prisma.post.findUniqueOrThrow({
      select: {
        revisions: { select: { createdAt: true, editorId: true, snapshot: true, version: true } },
        tags: { select: { tag: { select: { name: true } } } },
        title: true,
      },
      where: { id: original.id },
    });

    expect(persisted.title).toBe('Título revisado');
    expect(persisted.tags).toEqual([{ tag: { name: newTag.name } }]);
    expect(persisted.revisions).toHaveLength(1);
    expect(persisted.revisions[0]).toMatchObject({
      createdAt: editedAt,
      editorId: authorId,
      version: 1,
    });
    expect(persisted.revisions[0]?.snapshot).toMatchObject({
      slug: 'post-antes-da-revisao',
      tagNames: [oldTag.name],
      title: 'Título anterior',
    });
  });

  it('reverte a edição do post quando a substituição de tags falha', async () => {
    const authorId = await createAuthor();
    const original = buildPost(authorId, {
      currentSlug: 'post-para-rollback',
      status: PostStatus.DRAFT,
      title: 'Título preservado',
    });
    await createPost(original);
    const conflictingName = `Tag conflitante ${randomUUID()}`;
    records.tagNames.push(conflictingName);
    await prisma.tag.create({
      data: { name: conflictingName, slug: `slug-existente-${randomUUID()}` },
    });
    const updated = buildPost(authorId, {
      createdAt: original.createdAt,
      currentSlug: 'post-para-rollback',
      id: original.id,
      status: PostStatus.DRAFT,
      title: 'Título que deve ser revertido',
      updatedAt: new Date('2026-08-17T19:00:00.000Z'),
    });

    await expect(
      repository.update(updated, {
        tags: [{ name: conflictingName, slug: `outro-slug-${randomUUID()}` }],
      }),
    ).rejects.toMatchObject({ code: 'P2002' });

    await expect(
      prisma.post.findUniqueOrThrow({ select: { title: true }, where: { id: original.id } }),
    ).resolves.toEqual({ title: 'Título preservado' });
  });
});
