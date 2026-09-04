import type { components } from '@vavito/api-client';
import { describe, expect, it } from 'vitest';

import {
  createArticleMetadata,
  createArticleStructuredData,
} from '@web/features/posts/services/create-article-seo';
import { serializeStructuredData } from '@web/lib/seo/structured-data';

const post: components['schemas']['PostDetailResponseDto'] = {
  author: { avatarUrl: null, displayName: 'João Victor' },
  content: { content: [], type: 'doc' },
  contentSchemaVersion: 1,
  coverAlt: 'Diagrama de módulos da aplicação',
  coverUrl: 'https://storage.test/media/arquitetura.webp',
  excerpt: 'Uma introdução prática à arquitetura do projeto.',
  id: '019c2d62-6e90-7000-8000-000000000010',
  publishedAt: '2026-08-20T12:00:00.000Z',
  reactionCounts: { dislike: 0, like: 4 },
  readingTimeMinutes: 6,
  seoDescription: 'Aprenda a organizar uma aplicação escalável.',
  seoTitle: 'Arquitetura de software escalável',
  slug: 'arquitetura-nestjs',
  tags: [
    {
      id: '019c2d62-6e90-7000-8000-000000000011',
      name: 'Arquitetura',
      publishedPostCount: 1,
      slug: 'arquitetura',
    },
  ],
  title: 'Arquitetura NestJS',
  viewCount: 128,
  viewer: null,
};

describe('SEO do artigo', () => {
  it('prioriza os campos editoriais e expõe canonical e Open Graph de artigo', () => {
    const metadata = createArticleMetadata(post);

    expect(metadata.title).toEqual({ absolute: post.seoTitle });
    expect(metadata.description).toBe(post.seoDescription);
    expect(metadata.alternates).toEqual({
      canonical: 'https://vavitoarchives.com.br/artigos/arquitetura-nestjs',
    });
    expect(metadata.openGraph).toMatchObject({
      description: post.seoDescription,
      publishedTime: post.publishedAt,
      title: post.seoTitle,
      type: 'article',
      url: 'https://vavitoarchives.com.br/artigos/arquitetura-nestjs',
    });
    expect(metadata.twitter).toMatchObject({ card: 'summary_large_image' });
  });

  it('gera JSON-LD Article com dados canônicos e serialização segura', () => {
    const structuredData = createArticleStructuredData({
      ...post,
      seoDescription: '<script>alert(1)</script>',
    });
    const serialized = serializeStructuredData(structuredData);

    expect(structuredData).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'Article',
      datePublished: post.publishedAt,
      headline: post.seoTitle,
      mainEntityOfPage: 'https://vavitoarchives.com.br/artigos/arquitetura-nestjs',
    });
    expect(serialized).not.toContain('<script>');
    expect(serialized).toContain('\\u003cscript>');
  });

  it('usa título e resumo do artigo quando os campos de SEO estão vazios', () => {
    const metadata = createArticleMetadata({
      ...post,
      seoDescription: null,
      seoTitle: null,
    });

    expect(metadata.title).toBe(post.title);
    expect(metadata.description).toBe(post.excerpt);
  });
});
