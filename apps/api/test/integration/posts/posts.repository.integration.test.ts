import { randomUUID } from 'node:crypto';

import type { ConfigService } from '@nestjs/config';

import type { ApplicationConfig } from '@api/core/config/app.config';
import { PrismaService } from '@api/core/database/prisma.service';
import { MediaAssetStatus, MediaUsageType, UserRole } from '@api/generated/prisma/client';
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
    content,
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

    await expect(repository.findBySlug('slug-original')).resolves.toMatchObject({
      post: { id: post.id, title: 'Post atualizado' },
      requestedSlug: 'slug-original',
      requestedSlugIsCurrent: false,
    });
    await expect(repository.findBySlug('slug-atualizado')).resolves.toMatchObject({
      post: { id: post.id },
      requestedSlugIsCurrent: true,
    });
    await expect(repository.findSlugOwner('slug-original')).resolves.toEqual({
      isCurrent: false,
      postId: post.id,
    });

    await repository.delete(post.id);
    await expect(repository.findById(post.id)).resolves.toBeNull();
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
});
