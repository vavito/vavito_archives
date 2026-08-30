import { ApiClientError, type ApiClient } from '@vavito/api-client';

import { createWebPublicApiClient } from '@web/lib/api/api-client';

import type { ArticlePageData } from '../types/posts.types';

const RELATED_POSTS_LIMIT = 4;
const RELATED_POSTS_VISIBLE = 3;

interface GetArticlePageDataOptions {
  client?: ApiClient;
  slug: string;
}

export async function getArticlePageData({
  client = createWebPublicApiClient(),
  slug,
}: GetArticlePageDataOptions): Promise<ArticlePageData | null> {
  let detailResponse;

  try {
    detailResponse = await client.GET('/api/v1/posts/{slug}', {
      params: { path: { slug } },
    });
  } catch (error) {
    if (error instanceof ApiClientError && error.statusCode === 404) {
      return null;
    }

    throw error;
  }

  const post = detailResponse.data;

  if (!post) {
    throw new Error('A API não retornou o artigo esperado.');
  }

  const primaryTag = post.tags[0]?.slug;
  const relatedResponse = await client.GET('/api/v1/posts', {
    params: {
      query: {
        limit: RELATED_POSTS_LIMIT,
        page: 1,
        sort: 'recent',
        ...(primaryTag ? { tag: primaryTag } : {}),
      },
    },
  });

  if (!relatedResponse.data) {
    throw new Error('A API não retornou os artigos relacionados esperados.');
  }

  return {
    post,
    relatedPosts: relatedResponse.data.items
      .filter((relatedPost) => relatedPost.id !== post.id)
      .slice(0, RELATED_POSTS_VISIBLE),
  };
}
