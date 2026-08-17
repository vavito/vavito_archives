import type { Post } from '@api/modules/posts/domain/entities/post.entity';
import type { PostStatus } from '@api/modules/posts/domain/enums/post-status.enum';

export interface PostAuthorRecord {
  displayName: string;
  id: string;
}

export interface PostTagRecord {
  id: string;
  name: string;
  slug: string;
}

export interface PostCoverRecord {
  altText: string;
  id: string;
  storagePath: string;
}

export interface PostAggregateRecord {
  author: PostAuthorRecord;
  cover: PostCoverRecord | null;
  post: Post;
  tags: PostTagRecord[];
}

export interface PostSlugLookupRecord extends PostAggregateRecord {
  reactionCounts: {
    dislike: number;
    like: number;
  };
  requestedSlug: string;
  requestedSlugIsCurrent: boolean;
}

export interface PublicPostSummaryRecord {
  cover: PostCoverRecord | null;
  excerpt: string;
  id: string;
  publishedAt: Date;
  readingTimeMinutes: number;
  slug: string;
  tags: PostTagRecord[];
  title: string;
  viewsCount: number;
}

export interface AdminPostSummaryRecord {
  author: PostAuthorRecord;
  editedAt: Date | null;
  id: string;
  publishedAt: Date | null;
  slug: string | null;
  status: PostStatus;
  title: string;
  updatedAt: Date;
}

export interface PaginatedRecords<T> {
  items: T[];
  total: number;
}

export interface PostRevisionRecord {
  createdAt: Date;
  editor: PostAuthorRecord;
  id: string;
  snapshot: Record<string, unknown>;
  version: number;
}

export interface PublicPostsFilters {
  limit: number;
  page: number;
  sort: 'popular' | 'recent';
  tag?: string;
}

export interface AdminPostsFilters {
  limit: number;
  page: number;
  q?: string;
  status?: PostStatus;
}

export interface TagWriteRecord {
  name: string;
  slug: string;
}

export interface PostRevisionWriteRecord {
  createdAt: Date;
  editorId: string;
}

export interface PostUpdateOptions {
  revision?: PostRevisionWriteRecord;
  tags?: readonly TagWriteRecord[];
}

export interface TagWithPublishedCountRecord extends PostTagRecord {
  publishedPostCount: number;
}

export interface SlugOwnerRecord {
  isCurrent: boolean;
  postId: string;
}

export abstract class PostsRepository {
  abstract create(post: Post): Promise<void>;
  abstract delete(id: string): Promise<void>;
  abstract findById(id: string): Promise<PostAggregateRecord | null>;
  abstract findBySlug(slug: string): Promise<PostSlugLookupRecord | null>;
  abstract findSlugOwner(slug: string): Promise<SlugOwnerRecord | null>;
  abstract listAdmin(filters: AdminPostsFilters): Promise<PaginatedRecords<AdminPostSummaryRecord>>;
  abstract listPublic(
    filters: PublicPostsFilters,
  ): Promise<PaginatedRecords<PublicPostSummaryRecord>>;
  abstract listRevisions(
    postId: string,
    filters: Pick<AdminPostsFilters, 'limit' | 'page'>,
  ): Promise<PaginatedRecords<PostRevisionRecord>>;
  abstract listTags(): Promise<TagWithPublishedCountRecord[]>;
  abstract replaceTags(postId: string, tags: readonly TagWriteRecord[]): Promise<void>;
  abstract update(post: Post, options?: PostUpdateOptions): Promise<void>;
}
