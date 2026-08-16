import { PostStatus } from '@api/modules/posts/domain/enums/post-status.enum';
import { InvalidPostStatusTransitionError } from '@api/modules/posts/domain/errors/invalid-post-status-transition.error';
import { PostContentInvalidError } from '@api/modules/posts/domain/errors/post-content-invalid.error';
import { PostEditNotAllowedError } from '@api/modules/posts/domain/errors/post-edit-not-allowed.error';
import {
  PostNotReadyForPublicationError,
  type PostPublicationField,
} from '@api/modules/posts/domain/errors/post-not-ready-for-publication.error';

export type PostContentDocument = Readonly<Record<string, unknown>>;

export interface CreatePostProps {
  authorId: string;
  content: PostContentDocument;
  contentSchemaVersion: number;
  currentSlug: string | null;
  excerpt: string | null;
  id: string;
  now: Date;
  readingTimeMinutes?: number;
  seoDescription?: string | null;
  seoTitle?: string | null;
  title: string;
}

export interface UpdatePostContentProps {
  content: PostContentDocument;
  contentSchemaVersion: number;
  now: Date;
  readingTimeMinutes: number;
}

interface PostProps {
  archivedAt: Date | null;
  authorId: string;
  content: PostContentDocument;
  contentSchemaVersion: number;
  createdAt: Date;
  currentSlug: string | null;
  editedAt: Date | null;
  excerpt: string | null;
  id: string;
  publishedAt: Date | null;
  readingTimeMinutes: number;
  seoDescription: string | null;
  seoTitle: string | null;
  status: PostStatus;
  title: string;
  updatedAt: Date;
  viewsCount: number;
}

function cloneDate(date: Date): Date {
  return new Date(date.getTime());
}

function cloneContent(content: PostContentDocument): PostContentDocument {
  return structuredClone(content);
}

function isSupportedContent(content: PostContentDocument, schemaVersion: number): boolean {
  return (
    Number.isInteger(schemaVersion) &&
    schemaVersion > 0 &&
    content['type'] === 'doc' &&
    Array.isArray(content['content'])
  );
}

function hasVisibleContent(content: PostContentDocument): boolean {
  const nodes = content['content'];
  return Array.isArray(nodes) && nodes.length > 0;
}

export class Post {
  private constructor(private readonly props: PostProps) {}

  static create(props: CreatePostProps): Post {
    const readingTimeMinutes = props.readingTimeMinutes ?? 0;

    if (
      !isSupportedContent(props.content, props.contentSchemaVersion) ||
      !Number.isInteger(readingTimeMinutes) ||
      readingTimeMinutes < 0
    ) {
      throw new PostContentInvalidError();
    }

    return new Post({
      archivedAt: null,
      authorId: props.authorId,
      content: cloneContent(props.content),
      contentSchemaVersion: props.contentSchemaVersion,
      createdAt: cloneDate(props.now),
      currentSlug: props.currentSlug,
      editedAt: null,
      excerpt: props.excerpt,
      id: props.id,
      publishedAt: null,
      readingTimeMinutes,
      seoDescription: props.seoDescription ?? null,
      seoTitle: props.seoTitle ?? null,
      status: PostStatus.DRAFT,
      title: props.title,
      updatedAt: cloneDate(props.now),
      viewsCount: 0,
    });
  }

  get archivedAt(): Date | null {
    return this.props.archivedAt ? cloneDate(this.props.archivedAt) : null;
  }

  get authorId(): string {
    return this.props.authorId;
  }

  get content(): PostContentDocument {
    return cloneContent(this.props.content);
  }

  get contentSchemaVersion(): number {
    return this.props.contentSchemaVersion;
  }

  get createdAt(): Date {
    return cloneDate(this.props.createdAt);
  }

  get currentSlug(): string | null {
    return this.props.currentSlug;
  }

  get editedAt(): Date | null {
    return this.props.editedAt ? cloneDate(this.props.editedAt) : null;
  }

  get excerpt(): string | null {
    return this.props.excerpt;
  }

  get id(): string {
    return this.props.id;
  }

  get publishedAt(): Date | null {
    return this.props.publishedAt ? cloneDate(this.props.publishedAt) : null;
  }

  get readingTimeMinutes(): number {
    return this.props.readingTimeMinutes;
  }

  get seoDescription(): string | null {
    return this.props.seoDescription;
  }

  get seoTitle(): string | null {
    return this.props.seoTitle;
  }

  get status(): PostStatus {
    return this.props.status;
  }

  get title(): string {
    return this.props.title;
  }

  get updatedAt(): Date {
    return cloneDate(this.props.updatedAt);
  }

  get viewsCount(): number {
    return this.props.viewsCount;
  }

  publish(now: Date): void {
    this.ensureStatus('publish', PostStatus.DRAFT);

    const missingFields = this.missingPublicationFields();
    if (missingFields.length > 0) {
      throw new PostNotReadyForPublicationError(missingFields);
    }

    this.props.status = PostStatus.PUBLISHED;
    this.props.publishedAt = cloneDate(now);
    this.props.archivedAt = null;
    this.props.updatedAt = cloneDate(now);
  }

  unpublish(): void {
    this.ensureStatus('unpublish', PostStatus.PUBLISHED);
    this.props.status = PostStatus.DRAFT;
    this.props.publishedAt = null;
  }

  archive(now: Date): void {
    if (this.props.status === PostStatus.ARCHIVED) {
      throw new InvalidPostStatusTransitionError('archive', this.props.status);
    }

    this.props.status = PostStatus.ARCHIVED;
    this.props.archivedAt = cloneDate(now);
    this.props.updatedAt = cloneDate(now);
  }

  restoreAsDraft(): void {
    this.ensureStatus('restore as draft', PostStatus.ARCHIVED);
    this.props.status = PostStatus.DRAFT;
    this.props.publishedAt = null;
    this.props.archivedAt = null;
  }

  updateContent(props: UpdatePostContentProps): void {
    if (this.props.status === PostStatus.ARCHIVED) {
      throw new PostEditNotAllowedError();
    }

    if (
      !isSupportedContent(props.content, props.contentSchemaVersion) ||
      !Number.isInteger(props.readingTimeMinutes) ||
      props.readingTimeMinutes < 0 ||
      (this.props.status === PostStatus.PUBLISHED && !hasVisibleContent(props.content))
    ) {
      throw new PostContentInvalidError();
    }

    this.props.content = cloneContent(props.content);
    this.props.contentSchemaVersion = props.contentSchemaVersion;
    this.props.readingTimeMinutes = props.readingTimeMinutes;
    this.props.updatedAt = cloneDate(props.now);

    if (this.props.status === PostStatus.PUBLISHED) {
      this.props.editedAt = cloneDate(props.now);
    }
  }

  private ensureStatus(action: string, expectedStatus: PostStatus): void {
    if (this.props.status !== expectedStatus) {
      throw new InvalidPostStatusTransitionError(action, this.props.status);
    }
  }

  private missingPublicationFields(): PostPublicationField[] {
    const missingFields: PostPublicationField[] = [];

    if (this.props.title.trim().length === 0) {
      missingFields.push('title');
    }
    if (!this.props.excerpt || this.props.excerpt.trim().length === 0) {
      missingFields.push('excerpt');
    }
    if (!this.props.currentSlug || this.props.currentSlug.trim().length === 0) {
      missingFields.push('slug');
    }
    if (!hasVisibleContent(this.props.content)) {
      missingFields.push('content');
    }

    return missingFields;
  }
}
