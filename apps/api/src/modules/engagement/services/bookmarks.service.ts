import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { ForbiddenAccessException } from '@api/core/auth/errors/forbidden-access.exception';
import { ProfileAuthorizationRepository } from '@api/core/auth/repositories/profile-authorization.repository';
import { Bookmark } from '@api/modules/engagement/domain/entities/bookmark.entity';
import {
  type BookmarksFilters,
  BookmarksRepository,
} from '@api/modules/engagement/repositories/bookmarks.repository';
import type { PaginatedPostSummaryDto } from '@api/modules/posts/dto/response/paginated-posts-response.dto';
import { PostNotFoundException } from '@api/modules/posts/errors/post-not-found.exception';
import { PostMapper } from '@api/modules/posts/mappers/post.mapper';

export type ListBookmarksFilters = Pick<BookmarksFilters, 'limit' | 'page'>;

@Injectable()
export class BookmarksService {
  constructor(
    private readonly bookmarksRepository: BookmarksRepository,
    private readonly profileAuthorizationRepository: ProfileAuthorizationRepository,
  ) {}

  async save(profileId: string, postId: string): Promise<Bookmark> {
    await this.ensureActiveProfile(profileId);
    const result = await this.bookmarksRepository.save(
      Bookmark.create({ id: randomUUID(), now: new Date(), postId, profileId }),
    );

    if (!result.postExists || !result.bookmark) {
      throw new PostNotFoundException();
    }

    return result.bookmark;
  }

  async remove(profileId: string, postId: string): Promise<void> {
    await this.ensureActiveProfile(profileId);
    await this.bookmarksRepository.remove(profileId, postId);
  }

  async list(profileId: string, filters: ListBookmarksFilters): Promise<PaginatedPostSummaryDto> {
    await this.ensureActiveProfile(profileId);
    const result = await this.bookmarksRepository.list({ ...filters, profileId });

    return {
      items: result.items.map((post) => PostMapper.fromPublicSummaryRecord(post)),
      meta: {
        limit: filters.limit,
        page: filters.page,
        total: result.total,
        totalPages: Math.ceil(result.total / filters.limit),
      },
    };
  }

  private async ensureActiveProfile(profileId: string): Promise<void> {
    if (!(await this.profileAuthorizationRepository.findActiveRoleByProfileId(profileId))) {
      throw new ForbiddenAccessException();
    }
  }
}
