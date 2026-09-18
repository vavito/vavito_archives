import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { AvatarStorageService } from '@api/core/storage/services/avatar-storage.service';

import { ForbiddenAccessException } from '@api/core/auth/errors/forbidden-access.exception';
import { ProfileAuthorizationRepository } from '@api/core/auth/repositories/profile-authorization.repository';
import { UserRole } from '@api/generated/prisma/client';
import { MediaNotFoundException } from '@api/modules/media/errors/media-not-found.exception';
import { MediaRepository } from '@api/modules/media/repositories/media.repository';
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
import type { AdminTagResponseDto } from '@api/modules/posts/dto/response/admin-tag-response.dto';
import { TagNotFoundException } from '@api/modules/posts/errors/tag-not-found.exception';
import { throwPostDomainException } from '@api/modules/posts/errors/post-domain.exception';
import { PostNotFoundException } from '@api/modules/posts/errors/post-not-found.exception';
import { SlugAlreadyExistsException } from '@api/modules/posts/errors/slug-already-exists.exception';
import { PostMapper } from '@api/modules/posts/mappers/post.mapper';
import {
  type PostAggregateRecord,
  type PostPendingDraftRecord,
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
    private readonly mediaRepository: MediaRepository,
    private readonly mediaService: MediaService,
    private readonly avatarStorage: AvatarStorageService,
  ) {}

  async archive(actorId: string, postId: string): Promise<Post> {
    const { post } = await this.findAuthorizedPost(actorId, postId);
    this.executeDomainAction(() => post.archive(new Date()));
    await this.postsRepository.update(post, { clearPendingDraft: true });
    return post;
  }

  async getAdminDetail(actorId: string, postId: string): Promise<PostAdminDetailDto> {
    await this.ensureAdminActor(actorId);
    const aggregate = await this.postsRepository.findById(postId);

    if (!aggregate) {
      throw new PostNotFoundException();
    }

    const detail = PostMapper.fromAggregateToAdminDetail(aggregate, this.coverUrl(aggregate.cover));
    const pending = aggregate.pendingDraft;
    if (!pending || aggregate.post.status !== PostStatus.PUBLISHED) return detail;

    return {
      ...detail,
      content: structuredClone(pending.content),
      contentSchemaVersion: pending.contentSchemaVersion,
      coverAlt: pending.coverAlt,
      coverMediaId: pending.coverMediaId,
      coverPositionX: pending.coverPositionX ?? aggregate.cover?.displayPositionX ?? 50,
      coverPositionY: pending.coverPositionY ?? aggregate.cover?.displayPositionY ?? 50,
      coverScale: pending.coverScale,
      coverUrl: pending.coverStoragePath
        ? this.mediaService.publicUrl(pending.coverStoragePath)
        : null,
      excerpt: pending.excerpt,
      hasPendingChanges: true,
      pendingEditedAt: aggregate.pendingEditedAt?.toISOString() ?? null,
      readingTimeMinutes: pending.readingTimeMinutes,
      seoDescription: pending.seoDescription,
      seoTitle: pending.seoTitle,
      slug: pending.slug,
      tagNames: [...pending.tagNames],
      title: pending.title,
    };
  }

  async discardPendingChanges(actorId: string, postId: string): Promise<void> {
    const { pendingDraft, post } = await this.findAuthorizedPost(actorId, postId);

    if (post.status === PostStatus.PUBLISHED && pendingDraft) {
      await this.postsRepository.clearPendingDraft(post.id);
    }
  }

  async getPublicDetail(slug: string, viewerId?: string): Promise<PublicPostDetailResult> {
    const record = await this.postsRepository.findBySlug(slug, viewerId);

    if (!record) {
      throw new PostNotFoundException();
    }

    const canonicalSlug = record.post.currentSlug?.value;

    if (!canonicalSlug) {
      throw new PostNotFoundException();
    }

    return {
      canonicalSlug,
      data: PostMapper.fromSlugLookupToPublicDetail(
        record,
        this.coverUrl(record.cover),
        record.author.avatarPath ? this.avatarStorage.publicUrl(record.author.avatarPath) : null,
      ),
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

  async listAdminTags(actorId: string): Promise<AdminTagResponseDto[]> {
    await this.ensureAdminActor(actorId);
    return this.postsRepository.listAdminTags();
  }

  async updateTagVisibility(
    actorId: string,
    tagId: string,
    isPublic: boolean,
  ): Promise<AdminTagResponseDto> {
    await this.ensureAdminActor(actorId);
    const tag = await this.postsRepository.updateTagVisibility(tagId, isPublic);
    if (!tag) throw new TagNotFoundException();
    return tag;
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
    await this.postsRepository.delete(post.id);
  }

  async publish(actorId: string, postId: string): Promise<Post> {
    const aggregate = await this.findAuthorizedPost(actorId, postId);
    const { post, pendingDraft } = aggregate;

    if (post.status === PostStatus.PUBLISHED && pendingDraft) {
      const nextContent = this.executeDomainAction(() =>
        PostContent.create(pendingDraft.content, pendingDraft.contentSchemaVersion),
      );
      const nextSlug = pendingDraft.slug
        ? this.executeDomainAction(() => Slug.create(pendingDraft.slug!))
        : null;
      if (!nextSlug || pendingDraft.excerpt === null) {
        throw new PostNotFoundException();
      }
      const nextExcerpt = pendingDraft.excerpt;
      if (nextSlug) await this.ensureSlugAvailable(nextSlug, post.id);
      const now = new Date();
      this.executeDomainAction(() =>
        post.edit({
          content: nextContent,
          currentSlug: nextSlug,
          excerpt: nextExcerpt,
          now,
          readingTimeMinutes: pendingDraft.readingTimeMinutes,
          seoDescription: pendingDraft.seoDescription,
          seoTitle: pendingDraft.seoTitle,
          title: pendingDraft.title,
        }),
      );
      await this.postsRepository.update(post, {
        clearPendingDraft: true,
        coverAlt: pendingDraft.coverAlt,
        coverMediaId: pendingDraft.coverMediaId,
        coverPositionX: pendingDraft.coverPositionX ?? aggregate.cover?.displayPositionX ?? 50,
        coverPositionY: pendingDraft.coverPositionY ?? aggregate.cover?.displayPositionY ?? 50,
        coverScale: pendingDraft.coverScale,
        revision: { createdAt: now, editorId: actorId },
        tags: normalizeTags(pendingDraft.tagNames),
      });
      return post;
    }

    if (post.currentSlug) {
      await this.ensureSlugAvailable(post.currentSlug, post.id);
    }

    this.executeDomainAction(() => post.publish(new Date()));
    await this.postsRepository.update(post, { clearPendingDraft: true });
    return post;
  }

  async restore(actorId: string, postId: string): Promise<Post> {
    const { post } = await this.findAuthorizedPost(actorId, postId);
    this.executeDomainAction(() => post.restoreAsDraft());
    await this.postsRepository.update(post, { clearPendingDraft: true });
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
    await this.postsRepository.update(post, { clearPendingDraft: true });
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
    const coverMediaId = dto.coverMediaId;
    let coverRecord = aggregate.cover;

    if (coverMediaId) {
      const cover = await this.mediaRepository.findById(coverMediaId);

      if (!cover?.canBeAssociatedWithPost) {
        throw new MediaNotFoundException();
      }
      coverRecord = {
        altText: dto.coverAlt ?? cover.altText,
        displayPositionX: dto.coverPositionX ?? aggregate.cover?.displayPositionX ?? 50,
        displayPositionY: dto.coverPositionY ?? aggregate.cover?.displayPositionY ?? 50,
        displayScale: dto.coverScale ?? aggregate.cover?.displayScale ?? 100,
        id: cover.id,
        storagePath: cover.storagePath,
      };
    } else if (coverMediaId === null) {
      coverRecord = null;
    }

    const hasEditableChanges =
      changesContent ||
      nextSlug !== undefined ||
      tags !== undefined ||
      coverMediaId !== undefined ||
      dto.coverAlt !== undefined ||
      dto.coverPositionX !== undefined ||
      dto.coverPositionY !== undefined ||
      dto.coverScale !== undefined ||
      dto.excerpt !== undefined ||
      dto.seoDescription !== undefined ||
      dto.seoTitle !== undefined ||
      dto.title !== undefined;

    if (!hasEditableChanges) {
      return post;
    }

    const now = new Date();
    const wasPublished = post.status === PostStatus.PUBLISHED;
    if (wasPublished) {
      const existing = aggregate.pendingDraft;
      const pending: PostPendingDraftRecord = {
        content: structuredClone(
          nextContent?.document ?? existing?.content ?? post.content.document,
        ),
        contentSchemaVersion:
          nextContent?.schemaVersion ?? existing?.contentSchemaVersion ?? post.contentSchemaVersion,
        coverAlt: dto.coverAlt ?? coverRecord?.altText ?? existing?.coverAlt ?? null,
        coverMediaId:
          coverMediaId !== undefined
            ? coverMediaId
            : (existing?.coverMediaId ?? aggregate.cover?.id ?? null),
        coverStoragePath:
          coverMediaId === null
            ? null
            : (coverRecord?.storagePath ?? existing?.coverStoragePath ?? null),
        coverPositionX:
          dto.coverPositionX ?? existing?.coverPositionX ?? aggregate.cover?.displayPositionX ?? 50,
        coverPositionY:
          dto.coverPositionY ?? existing?.coverPositionY ?? aggregate.cover?.displayPositionY ?? 50,
        coverScale: dto.coverScale ?? existing?.coverScale ?? aggregate.cover?.displayScale ?? 100,
        excerpt: dto.excerpt !== undefined ? dto.excerpt : (existing?.excerpt ?? post.excerpt),
        readingTimeMinutes: nextContent
          ? readingTimeInMinutes(nextContent)
          : (existing?.readingTimeMinutes ?? post.readingTimeMinutes),
        seoDescription:
          dto.seoDescription !== undefined
            ? dto.seoDescription
            : (existing?.seoDescription ?? post.seoDescription),
        seoTitle: dto.seoTitle !== undefined ? dto.seoTitle : (existing?.seoTitle ?? post.seoTitle),
        slug:
          nextSlug !== undefined
            ? nextSlug.value
            : (existing?.slug ?? post.currentSlug?.value ?? null),
        tagNames:
          tags?.map(({ name }) => name) ??
          existing?.tagNames ??
          aggregate.tags.map(({ name }) => name),
        title: dto.title !== undefined ? dto.title : (existing?.title ?? post.title),
      };
      await this.postsRepository.savePendingDraft(post.id, pending, now);
      return post;
    }
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
      ...(coverMediaId !== undefined ? { coverMediaId } : {}),
      ...(dto.coverPositionX !== undefined ? { coverPositionX: dto.coverPositionX } : {}),
      ...(dto.coverPositionY !== undefined ? { coverPositionY: dto.coverPositionY } : {}),
      ...(dto.coverScale !== undefined ? { coverScale: dto.coverScale } : {}),
      ...(dto.coverAlt !== undefined ? { coverAlt: dto.coverAlt } : {}),
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
