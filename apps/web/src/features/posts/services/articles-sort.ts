import type { components } from '@vavito/api-client';

export type ArticlesSort = components['schemas']['PublicPostsSort'];

export function normalizeArticlesSort(value: string | undefined): ArticlesSort {
  return value === 'oldest' || value === 'popular' || value === 'least-viewed' ? value : 'recent';
}
