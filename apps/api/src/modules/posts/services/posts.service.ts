import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { ForbiddenAccessException } from '@api/core/auth/errors/forbidden-access.exception';
import { ProfileAuthorizationRepository } from '@api/core/auth/repositories/profile-authorization.repository';
import { UserRole } from '@api/generated/prisma/client';
import { Post } from '@api/modules/posts/domain/entities/post.entity';
import { PostStatus } from '@api/modules/posts/domain/enums/post-status.enum';
import {
  CURRENT_POST_CONTENT_SCHEMA_VERSION,
  PostContent,
} from '@api/modules/posts/domain/value-objects/post-content.value-object';
import { Slug } from '@api/modules/posts/domain/value-objects/slug.value-object';
import type { CreatePostDto } from '@api/modules/posts/dto/request/create-post.dto';
import type { UpdatePostDto } from '@api/modules/posts/dto/request/update-post.dto';
import { throwPostDomainException } from '@api/modules/posts/errors/post-domain.exception';
import { PostNotFoundException } from '@api/modules/posts/errors/post-not-found.exception';
import { SlugAlreadyExistsException } from '@api/modules/posts/errors/slug-already-exists.exception';
import {
  type PostAggregateRecord,
  PostsRepository,
  type TagWriteRecord,
} from '@api/modules/posts/repositories/posts.repository';

const WORDS_PER_MINUTE = 200;
const EMPTY_POST_DOCUMENT = { content: [], type: 'doc' } as const;

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
  ) {}

  async archive(actorId: string, postId: string): Promise<Post> {
    const { post } = await this.findAuthorizedPost(actorId, postId);
    this.executeDomainAction(() => post.archive(new Date()));
    await this.postsRepository.update(post);
    return post;
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
