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
  displayPositionX: number;
  displayPositionY: number;
  id: string;
  storagePath: string;
  displayScale: number;
}

export interface PostAggregateRecord {
  author: PostAuthorRecord & { avatarPath: string | null };
  cover: PostCoverRecord | null;
  post: Post;
  pendingDraft: PostPendingDraftRecord | null;
  pendingEditedAt: Date | null;
  tags: PostTagRecord[];
}

export interface PostPendingDraftRecord extends Record<string, unknown> {
  content: Record<string, unknown>;
  contentSchemaVersion: number;
  coverAlt: string | null;
  coverMediaId: string | null;
  coverStoragePath: string | null;
  coverScale: number;
  coverPositionX?: number;
  coverPositionY?: number;
  excerpt: string | null;
  readingTimeMinutes: number;
  seoDescription: string | null;
  seoTitle: string | null;
  slug: string | null;
  tagNames: string[];
  title: string;
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
  cover?: PostCoverRecord | null;
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
  sort: 'popular' | 'recent' | 'oldest' | 'least-viewed';
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
  clearPendingDraft?: boolean;
  coverAlt?: string | null;
  coverMediaId?: string | null;
  coverPositionX?: number;
  coverPositionY?: number;
  coverScale?: number;
  revision?: PostRevisionWriteRecord;
  tags?: readonly TagWriteRecord[];
}

export interface TagWithPublishedCountRecord extends PostTagRecord {
  publishedPostCount: number;
}

export interface AdminTagRecord extends TagWithPublishedCountRecord {
  isPublic: boolean;
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
  abstract clearPendingDraft(postId: string): Promise<void>;
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
  abstract listAdminTags(): Promise<AdminTagRecord[]>;
  abstract updateTagVisibility(id: string, isPublic: boolean): Promise<AdminTagRecord | null>;
  abstract replaceTags(postId: string, tags: readonly TagWriteRecord[]): Promise<void>;
  abstract registerView(
    slug: string,
    view: RegisterPostViewRecord,
  ): Promise<RegisterPostViewResult>;
  abstract savePendingDraft(
    postId: string,
    draft: PostPendingDraftRecord,
    editedAt: Date,
  ): Promise<void>;
  abstract update(post: Post, options?: PostUpdateOptions): Promise<void>;
}
