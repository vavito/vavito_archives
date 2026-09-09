import type { components } from '@vavito/api-client';

export type AdminPostStatus = components['schemas']['PostStatus'];
export type AdminPostTransition = 'archive' | 'publish' | 'restore' | 'unpublish';

export interface AdminPostAuthor {
  displayName: string;
  id: string;
}

export interface AdminPostSummary {
  author: AdminPostAuthor;
  editedAt: string | null;
  id: string;
  publishedAt: string | null;
  slug: string | null;
  status: AdminPostStatus;
  title: string;
  updatedAt: string;
}

export interface AdminPostDetail extends AdminPostSummary {
  archivedAt: string | null;
  content: Record<string, unknown>;
  contentSchemaVersion: number;
  coverAlt: string | null;
  coverMediaId: string | null;
  coverPositionX: number;
  coverPositionY: number;
  coverScale: number;
  coverUrl: string | null;
  createdAt: string;
  excerpt: string | null;
  hasPendingChanges: boolean;
  readingTimeMinutes: number;
  seoDescription: string | null;
  seoTitle: string | null;
  tagNames: string[];
  tags: components['schemas']['TagResponseDto'][];
  viewCount: number;
}

export interface AdminPostsFilters {
  page: number;
  query: string;
  status: AdminPostStatus | null;
}

export interface AdminPostsPage {
  filters: AdminPostsFilters;
  items: AdminPostSummary[];
  meta: components['schemas']['PaginationMetaDto'];
}

export type AdminPostTransitionResult =
  | {
      data: AdminPostDetail;
      message: string;
      ok: true;
    }
  | {
      code: string | null;
      message: string;
      ok: false;
    };
