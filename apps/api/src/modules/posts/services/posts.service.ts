import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { ForbiddenAccessException } from '@api/core/auth/errors/forbidden-access.exception';
import { ProfileAuthorizationRepository } from '@api/core/auth/repositories/profile-authorization.repository';
import { UserRole } from '@api/generated/prisma/client';
import { MediaService } from '@api/modules/media/services/media.service';
import { Post } from '@api/modules/posts/domain/entities/post.entity';
import { PostStatus } from '@api/modules/posts/domain/enums/post-status.enum';
import {
  CURRENT_POST_CONTENT_SCHEMA_VERSION,
  PostContent,
} from '@api/modules/posts/domain/value-objects/post-content.value-object';
import { Slug } from '@api/modules/posts/domain/value-objects/slug.value-object';
import type { CreatePostDto } from '@api/modules/posts/dto/request/create-post.dto';
import type { UpdatePostDto } from '@api/modules/posts/dto/request/update-post.dto';
import type { ListAdminPostsQueryDto } from '@api/modules/posts/dto/query/list-admin-posts-query.dto';
import type { ListPublicPostsQueryDto } from '@api/modules/posts/dto/query/list-public-posts-query.dto';
import {
  POST_SEARCH_MAX_RESULTS,
  type SearchPostsQueryDto,
} from '@api/modules/posts/dto/query/search-posts-query.dto';
import type {
  PaginatedPostAdminSummaryDto,
  PaginatedPostRevisionAdminDto,
  PaginatedPostSummaryDto,
} from '@api/modules/posts/dto/response/paginated-posts-response.dto';
import type { PostAdminDetailDto } from '@api/modules/posts/dto/response/post-admin-response.dto';
import type { PostDetailResponseDto } from '@api/modules/posts/dto/response/post-detail-response.dto';
import type { PostSummaryDto } from '@api/modules/posts/dto/response/post-summary.dto';
import type { TagResponseDto } from '@api/modules/posts/dto/response/tag-response.dto';
import { throwPostDomainException } from '@api/modules/posts/errors/post-domain.exception';
import { PostNotFoundException } from '@api/modules/posts/errors/post-not-found.exception';
import { SlugAlreadyExistsException } from '@api/modules/posts/errors/slug-already-exists.exception';
import { PostMapper } from '@api/modules/posts/mappers/post.mapper';
import {
  type PostAggregateRecord,
  PostsRepository,
  type TagWriteRecord,
} from '@api/modules/posts/repositories/posts.repository';
import {
  PostViewFingerprintService,
  type PostViewSignal,
} from '@api/modules/posts/services/post-view-fingerprint.service';
import type { AdminPaginationQueryDto } from '@api/shared/pagination/dto/pagination-query.dto';

const WORDS_PER_MINUTE = 200;
const EMPTY_POST_DOCUMENT = { content: [], type: 'doc' } as const;

export interface PublicPostDetailResult {
  canonicalSlug: string;
  data: PostDetailResponseDto;
  shouldRedirect: boolean;
}

function paginationMeta(page: number, limit: number, total: number) {
  return {
    limit,
    page,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

function collectText(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap(collectText);
  }
  if (typeof value !== 'object' || value === null) {
    return [];
  }

  const record = value as Record<string, unknown>;
  const ownText = typeof record['text'] === 'string' ? [record['text']] : [];
  return [...ownText, ...collectText(record['content'])];
}

function readingTimeInMinutes(content: PostContent): number {
  const words = collectText(content.document).join(' ').trim().split(/\s+/u).filter(Boolean).length;

  return words === 0 ? 0 : Math.ceil(words / WORDS_PER_MINUTE);
}

function normalizeTags(names: readonly string[]): TagWriteRecord[] {
  return [
    ...new Map(
      names.map((name) => {
        const normalizedName = name.normalize('NFC').trim().replaceAll(/\s+/g, ' ');
        const slug = Slug.create(normalizedName).value;
        return [slug, { name: normalizedName, slug }];
      }),
    ).values(),
  ];
}

@Injectable()
export class PostsService {
  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly profileAuthorizationRepository: ProfileAuthorizationRepository,
    private readonly postViewFingerprintService: PostViewFingerprintService,
    private readonly mediaService: MediaService,
  ) {}

  async archive(actorId: string, postId: string): Promise<Post> {
    const { post } = await this.findAuthorizedPost(actorId, postId);
    this.executeDomainAction(() => post.archive(new Date()));
    await this.postsRepository.update(post);
    return post;
  }

  async getAdminDetail(actorId: string, postId: string): Promise<PostAdminDetailDto> {
    await this.ensureAdminActor(actorId);
    const aggregate = await this.postsRepository.findById(postId);

    if (!aggregate) {
      throw new PostNotFoundException();
    }

    return PostMapper.fromAggregateToAdminDetail(aggregate, this.coverUrl(aggregate.cover));
  }

  async getPublicDetail(slug: string): Promise<PublicPostDetailResult> {
    const record = await this.postsRepository.findBySlug(slug);

    if (!record) {
      throw new PostNotFoundException();
    }

    const canonicalSlug = record.post.currentSlug?.value;

    if (!canonicalSlug) {
      throw new PostNotFoundException();
    }

    return {
      canonicalSlug,
      data: PostMapper.fromSlugLookupToPublicDetail(record, this.coverUrl(record.cover)),
      shouldRedirect: !record.requestedSlugIsCurrent,
    };
  }

  async listAdmin(
    actorId: string,
    query: ListAdminPostsQueryDto,
  ): Promise<PaginatedPostAdminSummaryDto> {
    await this.ensureAdminActor(actorId);
    const result = await this.postsRepository.listAdmin(query);

    return {
      items: result.items.map((item) => PostMapper.fromAdminSummaryRecord(item)),
      meta: paginationMeta(query.page, query.limit, result.total),
    };
  }

  async listPublic(query: ListPublicPostsQueryDto): Promise<PaginatedPostSummaryDto> {
    const result = await this.postsRepository.listPublic(query);

    return {
      items: result.items.map((item) =>
        PostMapper.fromPublicSummaryRecord(item, this.coverUrl(item.cover)),
      ),
      meta: paginationMeta(query.page, query.limit, result.total),
    };
  }

  async listRevisions(
    actorId: string,
    postId: string,
    query: AdminPaginationQueryDto,
  ): Promise<PaginatedPostRevisionAdminDto> {
    await this.ensureAdminActor(actorId);

    if (!(await this.postsRepository.findById(postId))) {
      throw new PostNotFoundException();
    }

    const result = await this.postsRepository.listRevisions(postId, query);

    return {
      items: result.items.map((item) => PostMapper.fromRevisionRecord(item)),
      meta: paginationMeta(query.page, query.limit, result.total),
    };
  }

  async searchPublic(query: SearchPostsQueryDto): Promise<PostSummaryDto[]> {
    const normalizedQuery = query.q
      .normalize('NFC')
      .trim()
      .replaceAll(/\s+/g, ' ')
      .toLocaleLowerCase('pt-BR');
    const records = await this.postsRepository.searchPublic(
      normalizedQuery,
      POST_SEARCH_MAX_RESULTS,
    );

    return records.map((record) =>
      PostMapper.fromPublicSummaryRecord(record, this.coverUrl(record.cover)),
    );
  }

  async listTags(): Promise<TagResponseDto[]> {
    const tags = await this.postsRepository.listTags();

    return tags.map((tag) => ({ ...tag }));
  }

  async create(authorId: string, dto: CreatePostDto): Promise<Post> {
    await this.ensureActiveActor(authorId);
    const requestedSlug = dto.slug;
    const currentSlug = requestedSlug
      ? this.executeDomainAction(() => Slug.create(requestedSlug))
      : null;

    if (currentSlug) {
      await this.ensureSlugAvailable(currentSlug);
    }

    const post = this.executeDomainAction(() =>
      Post.create({
        authorId,
        content: PostContent.create(EMPTY_POST_DOCUMENT, CURRENT_POST_CONTENT_SCHEMA_VERSION),
        currentSlug,
        excerpt: null,
        id: randomUUID(),
        now: new Date(),
        title: dto.title ?? '',
      }),
    );

    await this.postsRepository.create(post);
    return post;
  }

  async delete(actorId: string, postId: string): Promise<void> {
    const { post } = await this.findAuthorizedPost(actorId, postId);
    this.executeDomainAction(() => post.ensureCanDelete());
    await this.postsRepository.delete(post.id);
  }

  async publish(actorId: string, postId: string): Promise<Post> {
    const { post } = await this.findAuthorizedPost(actorId, postId);

    if (post.currentSlug) {
      await this.ensureSlugAvailable(post.currentSlug, post.id);
    }

    this.executeDomainAction(() => post.publish(new Date()));
    await this.postsRepository.update(post);
    return post;
  }

  async restore(actorId: string, postId: string): Promise<Post> {
    const { post } = await this.findAuthorizedPost(actorId, postId);
    this.executeDomainAction(() => post.restoreAsDraft());
    await this.postsRepository.update(post);
    return post;
  }

  async registerView(slug: string, signal: PostViewSignal): Promise<void> {
    const bucketDate = new Date().toISOString().slice(0, 10);
    const result = await this.postsRepository.registerView(slug, {
      bucketDate,
      fingerprintHash: this.postViewFingerprintService.createDailyFingerprint(signal, bucketDate),
      id: randomUUID(),
    });

    if (!result.postExists) {
      throw new PostNotFoundException();
    }
  }

  async unpublish(actorId: string, postId: string): Promise<Post> {
    const { post } = await this.findAuthorizedPost(actorId, postId);
    this.executeDomainAction(() => post.unpublish());
    await this.postsRepository.update(post);
    return post;
  }

  async update(actorId: string, postId: string, dto: UpdatePostDto): Promise<Post> {
    const aggregate = await this.findAuthorizedPost(actorId, postId);
    const post = aggregate.post;
    const requestedSlug = dto.slug;
    const requestedTags = dto.tagNames;
    const nextSlug = requestedSlug
      ? this.executeDomainAction(() => Slug.create(requestedSlug))
      : undefined;

    if (nextSlug) {
      await this.ensureSlugAvailable(nextSlug, post.id);
    }

    const changesContent = dto.content !== undefined || dto.contentSchemaVersion !== undefined;
    const nextContent = changesContent
      ? this.executeDomainAction(() =>
          PostContent.create(
            dto.content ?? post.content.document,
            dto.contentSchemaVersion ?? post.contentSchemaVersion,
          ),
        )
      : undefined;
    const tags =
      requestedTags === undefined
        ? undefined
        : this.executeDomainAction(() => normalizeTags(requestedTags));
    const hasEditableChanges =
      changesContent ||
      nextSlug !== undefined ||
      tags !== undefined ||
      dto.excerpt !== undefined ||
      dto.seoDescription !== undefined ||
      dto.seoTitle !== undefined ||
      dto.title !== undefined;

    if (!hasEditableChanges) {
      return post;
    }

    const now = new Date();
    const wasPublished = post.status === PostStatus.PUBLISHED;
    this.executeDomainAction(() =>
      post.edit({
        now,
        ...(nextContent
          ? { content: nextContent, readingTimeMinutes: readingTimeInMinutes(nextContent) }
          : {}),
        ...(nextSlug ? { currentSlug: nextSlug } : {}),
        ...(dto.excerpt !== undefined ? { excerpt: dto.excerpt } : {}),
        ...(dto.seoDescription !== undefined ? { seoDescription: dto.seoDescription } : {}),
        ...(dto.seoTitle !== undefined ? { seoTitle: dto.seoTitle } : {}),
        ...(dto.title !== undefined ? { title: dto.title } : {}),
      }),
    );

    await this.postsRepository.update(post, {
      ...(wasPublished ? { revision: { createdAt: now, editorId: actorId } } : {}),
      ...(tags ? { tags } : {}),
    });
    return post;
  }

  private coverUrl(cover: PostAggregateRecord['cover']): string | null {
    return cover ? this.mediaService.publicUrl(cover.storagePath) : null;
  }

  private async ensureActiveActor(actorId: string): Promise<UserRole> {
    const role = await this.profileAuthorizationRepository.findActiveRoleByProfileId(actorId);

    if (!role) {
      throw new ForbiddenAccessException();
    }

    return role;
  }

  private executeDomainAction<T>(action: () => T): T {
    try {
      return action();
    } catch (error) {
      throwPostDomainException(error);
    }
  }

  private async ensureAdminActor(actorId: string): Promise<void> {
    if ((await this.ensureActiveActor(actorId)) !== UserRole.ADMIN) {
      throw new ForbiddenAccessException();
    }
  }

  private async ensureSlugAvailable(slug: Slug, postId?: string): Promise<void> {
    const owner = await this.postsRepository.findSlugOwner(slug.value);

    if (owner && owner.postId !== postId) {
      throw new SlugAlreadyExistsException();
    }
  }

  private async findAuthorizedPost(actorId: string, postId: string): Promise<PostAggregateRecord> {
    const [aggregate, role] = await Promise.all([
      this.postsRepository.findById(postId),
      this.ensureActiveActor(actorId),
    ]);

    if (!aggregate) {
      throw new PostNotFoundException();
    }

    if (aggregate.post.authorId !== actorId && role !== UserRole.ADMIN) {
      throw new ForbiddenAccessException();
    }

    return aggregate;
  }
}
