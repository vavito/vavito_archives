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
  viewer: {
    bookmarked: boolean;
    reaction: 'DISLIKE' | 'LIKE' | null;
  } | null;
}

export interface PublishedPostReferenceRecord {
  excerpt: string;
  id: string;
  publishedAt: Date;
  readingTimeMinutes: number;
  slug: string;
  title: string;
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

export interface RegisterPostViewRecord {
  bucketDate: string;
  fingerprintHash: string;
  id: string;
}

export interface RegisterPostViewResult {
  counted: boolean;
  postExists: boolean;
}

export abstract class PostsRepository {
  abstract create(post: Post): Promise<void>;
  abstract delete(id: string): Promise<void>;
  abstract findById(id: string): Promise<PostAggregateRecord | null>;
  abstract findBySlug(slug: string, viewerId?: string): Promise<PostSlugLookupRecord | null>;
  abstract findPublishedReferenceById(id: string): Promise<PublishedPostReferenceRecord | null>;
  abstract findPublishedReferenceBySlug(slug: string): Promise<PublishedPostReferenceRecord | null>;
  abstract findSlugOwner(slug: string): Promise<SlugOwnerRecord | null>;
  abstract listAdmin(filters: AdminPostsFilters): Promise<PaginatedRecords<AdminPostSummaryRecord>>;
  abstract listPublic(
    filters: PublicPostsFilters,
  ): Promise<PaginatedRecords<PublicPostSummaryRecord>>;
  abstract searchPublic(query: string, limit: number): Promise<PublicPostSummaryRecord[]>;
  abstract listRevisions(
    postId: string,
    filters: Pick<AdminPostsFilters, 'limit' | 'page'>,
  ): Promise<PaginatedRecords<PostRevisionRecord>>;
  abstract listTags(): Promise<TagWithPublishedCountRecord[]>;
  abstract replaceTags(postId: string, tags: readonly TagWriteRecord[]): Promise<void>;
  abstract registerView(
    slug: string,
    view: RegisterPostViewRecord,
  ): Promise<RegisterPostViewResult>;
  abstract update(post: Post, options?: PostUpdateOptions): Promise<void>;
}
