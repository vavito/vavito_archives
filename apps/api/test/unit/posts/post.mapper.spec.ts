import {
  PostStatus as PrismaPostStatus,
  ReactionType,
  type PostSlug as PrismaPostSlug,
} from '@api/generated/prisma/client';
import { PostStatus } from '@api/modules/posts/domain/enums/post-status.enum';
import { PostMapper, type PrismaPostWithSlugs } from '@api/modules/posts/mappers/post.mapper';

const CREATED_AT = new Date('2026-08-16T10:00:00.000Z');
const UPDATED_AT = new Date('2026-08-16T11:00:00.000Z');
const PUBLISHED_AT = new Date('2026-08-16T10:30:00.000Z');
const CONTENT = {
  content: [{ content: [{ text: 'Conteúdo', type: 'text' }], type: 'paragraph' }],
  type: 'doc',
};

function createSlug(overrides: Partial<PrismaPostSlug> = {}): PrismaPostSlug {
  return {
    createdAt: CREATED_AT,
    id: '3242f16a-50d7-4c5b-94a2-10f81b0208d2',
    isCurrent: true,
    postId: '957c8388-cb96-4f0c-98b3-56b84c1fe67e',
    retiredAt: null,
    slug: 'primeiro-artigo',
    ...overrides,
  };
}

function createRecord(overrides: Partial<PrismaPostWithSlugs> = {}): PrismaPostWithSlugs {
  return {
    archivedAt: null,
    authorId: 'ad4ce1ef-339f-45dc-bb91-a2f7ffbf3026',
    content: CONTENT,
    contentSchemaVersion: 1,
    createdAt: CREATED_AT,
    editedAt: null,
    excerpt: 'Resumo do artigo.',
    id: '957c8388-cb96-4f0c-98b3-56b84c1fe67e',
    publishedAt: PUBLISHED_AT,
    readingTimeMinutes: 4,
    seoDescription: 'Descrição SEO',
    seoTitle: 'Título SEO',
    slugs: [createSlug()],
    status: PrismaPostStatus.PUBLISHED,
    title: 'Primeiro artigo',
    updatedAt: UPDATED_AT,
    viewsCount: 42,
    ...overrides,
  };
}

const responseContext = {
  cover: {
    alt: 'Capa do post',
    mediaId: '7663419a-6858-43a2-b324-143742206206',
    url: 'https://cdn.example.com/capa.webp',
  },
  tags: [
    {
      id: '4c867413-093f-4ee6-acce-bd0cb4db91f8',
      name: 'NestJS',
      slug: 'nestjs',
    },
  ],
};

describe('PostMapper', () => {
  it('restaura o domínio a partir do Prisma e gera dados persistíveis', () => {
    const post = PostMapper.toDomain(createRecord());
    const persistence = PostMapper.toPersistence(post);

    expect(post.status).toBe(PostStatus.PUBLISHED);
    expect(post.currentSlug?.value).toBe('primeiro-artigo');
    expect(post.content.document).toEqual(CONTENT);
    expect(persistence).toMatchObject({
      authorId: post.authorId,
      content: CONTENT,
      contentSchemaVersion: 1,
      status: PrismaPostStatus.PUBLISHED,
      viewsCount: 42,
    });
  });

  it('mapeia respostas públicas sem campos administrativos', () => {
    const post = PostMapper.toDomain(createRecord());
    const summary = PostMapper.toPublicSummary(post, responseContext);
    const detail = PostMapper.toPublicDetail(post, {
      ...responseContext,
      author: { avatarUrl: 'https://storage.test/avatars/author.webp', displayName: 'Autora' },
      reactionCounts: { dislike: 1, like: 10 },
      viewer: { bookmarked: true, reaction: ReactionType.LIKE },
    });

    expect(summary).toMatchObject({
      coverAlt: 'Capa do post',
      excerpt: 'Resumo do artigo.',
      publishedAt: PUBLISHED_AT.toISOString(),
      slug: 'primeiro-artigo',
      viewCount: 42,
    });
    expect(summary).not.toHaveProperty('authorId');
    expect(summary).not.toHaveProperty('editedAt');
    expect(detail).toMatchObject({
      author: { avatarUrl: 'https://storage.test/avatars/author.webp', displayName: 'Autora' },
      content: CONTENT,
      contentSchemaVersion: 1,
      reactionCounts: { dislike: 1, like: 10 },
      viewer: { bookmarked: true, reaction: ReactionType.LIKE },
    });
  });

  it('mapeia rascunho para o contrato administrativo', () => {
    const post = PostMapper.toDomain(
      createRecord({
        excerpt: null,
        publishedAt: null,
        slugs: [],
        status: PrismaPostStatus.DRAFT,
        title: '',
      }),
    );
    const response = PostMapper.toAdminDetail(post, {
      ...responseContext,
      author: {
        displayName: 'João Victor',
        id: post.authorId,
      },
    });

    expect(response).toMatchObject({
      author: { displayName: 'João Victor', id: post.authorId },
      excerpt: null,
      publishedAt: null,
      slug: null,
      status: PostStatus.DRAFT,
    });
    expect(response).not.toHaveProperty('authorId');
  });

  it('impede resposta pública para post fora de publicação', () => {
    const post = PostMapper.toDomain(
      createRecord({ publishedAt: null, status: PrismaPostStatus.DRAFT }),
    );

    expect(() => PostMapper.toPublicSummary(post, responseContext)).toThrow(
      'Only a complete published post can be mapped to a public response.',
    );
  });

  it('rejeita mais de um slug atual vindo da persistência', () => {
    const record = createRecord({
      slugs: [
        createSlug(),
        createSlug({ id: 'b330f039-5aa2-4a73-b882-5e5a11db46cf', slug: 'outro-slug' }),
      ],
    });

    expect(() => PostMapper.toDomain(record)).toThrow(
      'A post cannot have more than one current slug.',
    );
  });
});
