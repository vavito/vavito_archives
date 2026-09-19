import { isValidElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

const { getArticlePageData, getAuthenticatedSession, getCommentsPage, getArticleRelatedPosts } =
  vi.hoisted(() => ({
    getArticlePageData: vi.fn(),
    getAuthenticatedSession: vi.fn(),
    getCommentsPage: vi.fn(() => new Promise(() => {})),
    getArticleRelatedPosts: vi.fn(() => new Promise(() => {})),
  }));

const { createWebCachedPublicApiClient } = vi.hoisted(() => ({
  createWebCachedPublicApiClient: vi.fn(() => ({ name: 'cached-public-client' })),
}));

vi.mock('@web/lib/auth/authenticated-session', () => ({
  getAuthenticatedSession,
}));
vi.mock('@web/lib/api/api-client', () => ({
  createWebAuthenticatedApiClient: vi.fn(),
  createWebCachedPublicApiClient,
}));
vi.mock('@web/features/posts', () => ({
  ArticlePageContent: () => null,
  RelatedPostsSection: () => null,
  createArticleMetadata: vi.fn(),
  createArticleStructuredData: vi.fn(() => ({ '@type': 'Article' })),
  getArticlePageData,
  getArticleRelatedPosts,
}));
vi.mock('@web/features/comments', () => ({
  CommentsSection: () => null,
  getCommentsPage,
}));
vi.mock('@web/features/engagement', () => ({
  ArticleReactions: () => null,
  BookmarkButton: () => null,
}));
vi.mock('@web/features/profile', () => ({ getProfile: vi.fn() }));

import ArticlePage from '@web/app/(public)/artigos/[slug]/page';

describe('carregamento principal do artigo', () => {
  it('entrega a página sem aguardar consultas secundárias que não terminam', async () => {
    getAuthenticatedSession.mockReturnValue(new Promise(() => {}));
    getArticlePageData.mockResolvedValue({
      post: {
        id: 'post-1',
        reactionCounts: { dislike: 0, like: 2 },
        slug: 'artigo',
        viewer: null,
      },
      relatedPosts: [],
    });

    const result = await ArticlePage({
      params: Promise.resolve({ slug: 'artigo' }),
      searchParams: Promise.resolve({}),
    });

    expect(isValidElement(result)).toBe(true);
    expect(getArticlePageData).toHaveBeenCalledWith({
      client: { name: 'cached-public-client' },
      includeRelatedPosts: false,
      slug: 'artigo',
    });
  }, 1_000);
});
