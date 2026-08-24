import type { Bookmark } from '@api/modules/engagement/domain/entities/bookmark.entity';
import type {
  PaginatedRecords,
  PublicPostSummaryRecord,
} from '@api/modules/posts/repositories/posts.repository';

export interface BookmarkMutationResult {
  bookmark: Bookmark | null;
  postExists: boolean;
}

export interface BookmarksFilters {
  limit: number;
  page: number;
  profileId: string;
}

export abstract class BookmarksRepository {
  abstract list(filters: BookmarksFilters): Promise<PaginatedRecords<PublicPostSummaryRecord>>;
  abstract remove(profileId: string, postId: string): Promise<void>;
  abstract save(bookmark: Bookmark): Promise<BookmarkMutationResult>;
}
