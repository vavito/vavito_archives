import type { components } from '@vavito/api-client';

export type BookmarksPage = components['schemas']['PaginatedPostSummaryDto'];
export type BookmarkState = components['schemas']['BookmarkResponseDto'];
export type BookmarkActionResult =
  { bookmarked: boolean; ok: true } | { message: string; ok: false };
