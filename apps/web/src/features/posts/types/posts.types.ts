import type { components } from '@vavito/api-client';

export type PostSummary = components['schemas']['PostSummaryDto'];
export type TagSummary = components['schemas']['TagResponseDto'];

export interface ArticlesFilters {
  page: number;
  tag: string | null;
}

export interface ArticlesData {
  filters: ArticlesFilters;
  posts: PostSummary[];
  pagination: components['schemas']['PaginationMetaDto'];
  tags: TagSummary[];
}
