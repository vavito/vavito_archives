import type { components } from '@vavito/api-client';

export type PostSummary = components['schemas']['PostSummaryDto'];
export type TagSummary = components['schemas']['TagResponseDto'];
export type PostDetail = components['schemas']['PostDetailResponseDto'];

export interface ArticlePageData {
  post: PostDetail;
  relatedPosts: PostSummary[];
}

export interface TiptapMark {
  attrs?: Record<string, unknown>;
  type: string;
}

export interface TiptapNode {
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  marks?: TiptapMark[];
  text?: string;
  type: string;
}

export interface ArticlesFilters {
  page: number;
  sort?: components['schemas']['PublicPostsSort'];
  tag: string | null;
}

export interface ArticlesData {
  filters: ArticlesFilters;
  posts: PostSummary[];
  pagination: components['schemas']['PaginationMetaDto'];
  tags: TagSummary[];
}
