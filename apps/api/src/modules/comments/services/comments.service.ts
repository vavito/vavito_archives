import { randomUUID } from 'node:crypto';

import { ForbiddenAccessException } from '@api/core/auth/errors/forbidden-access.exception';
import { ProfileAuthorizationRepository } from '@api/core/auth/repositories/profile-authorization.repository';
import { MailService } from '@api/core/mail/services/mail.service';
import { AvatarStorageService } from '@api/core/storage/services/avatar-storage.service';
import { UserRole } from '@api/generated/prisma/client';
import { Comment } from '@api/modules/comments/domain/entities/comment.entity';
import { CommentStatus } from '@api/modules/comments/domain/enums/comment-status.enum';
import { CommentNestingLimitExceededError } from '@api/modules/comments/domain/errors/comment-nesting-limit-exceeded.error';
import { CommentParentInvalidError } from '@api/modules/comments/domain/errors/comment-parent-invalid.error';
import { PostNotOpenForCommentsError } from '@api/modules/comments/domain/errors/post-not-open-for-comments.error';
import { CommentContent } from '@api/modules/comments/domain/value-objects/comment-content.value-object';
import type {
  ListAdminCommentsQueryDto,
  ListCommentsQueryDto,
} from '@api/modules/comments/dto/query/list-comments-query.dto';
import type { CreateCommentDto } from '@api/modules/comments/dto/request/create-comment.dto';
import {
  CommentModerationStatus,
  type ModerateCommentDto,
} from '@api/modules/comments/dto/request/moderate-comment.dto';
import type { UpdateCommentDto } from '@api/modules/comments/dto/request/update-comment.dto';
import type {
  CommentAuthorDto,
  CommentResponseDto,
  PaginatedAdminCommentsResponseDto,
  PaginatedCommentsResponseDto,
} from '@api/modules/comments/dto/response/comment-response.dto';
import { throwCommentDomainException } from '@api/modules/comments/errors/comment-domain.exception';
import { CommentNotFoundException } from '@api/modules/comments/errors/comment-not-found.exception';
import { CommentResponseMapper } from '@api/modules/comments/mappers/comment-response.mapper';
import type {
  CommentAuthorRecord,
  CommentRecord,
} from '@api/modules/comments/repositories/comments.repository';
import { CommentsRepository } from '@api/modules/comments/repositories/comments.repository';
import { PostsRepository } from '@api/modules/posts/repositories/posts.repository';
import { Injectable, Logger } from '@nestjs/common';

function paginationMeta(page: number, limit: number, total: number) {
  return { limit, page, total, totalPages: total === 0 ? 0 : Math.ceil(total / limit) };
}

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(
    private readonly commentsRepository: CommentsRepository,
    private readonly postsRepository: PostsRepository,
    private readonly authorizationRepository: ProfileAuthorizationRepository,
    private readonly avatarStorage: AvatarStorageService,
    private readonly mailService: MailService,
  ) {}

  async create(actorId: string, slug: string, dto: CreateCommentDto): Promise<CommentResponseDto> {
    const [postAggregate] = await Promise.all([
      this.postsRepository.findBySlug(slug),
      this.ensureActiveActor(actorId),
    ]);

    if (!postAggregate) {
      throwCommentDomainException(new PostNotOpenForCommentsError());
    }

    if (dto.parentId) await this.ensureValidParent(dto.parentId, postAggregate.post.id);

    const comment = this.executeDomainAction(() =>
      Comment.create({
        authorId: actorId,
        content: CommentContent.create(dto.content),
        id: randomUUID(),
        now: new Date(),
        ...(dto.parentId ? { parentId: dto.parentId } : {}),
        postId: postAggregate.post.id,
      }),
    );
    await this.commentsRepository.create(comment);

    const record = await this.requireComment(comment.id);
    await this.notifyNewComment(record, postAggregate.post.title);
    return CommentResponseMapper.toPublic(record, this.toAuthorDto(record.author));
  }

  async delete(actorId: string, id: string): Promise<void> {
    const [record, role] = await Promise.all([
      this.requireComment(id),
      this.ensureActiveActor(actorId),
    ]);
    if (record.comment.authorId !== actorId && role !== UserRole.ADMIN)
      throw new ForbiddenAccessException();

    this.executeDomainAction(() => record.comment.softDelete(new Date()));
    await this.commentsRepository.save(record.comment);
  }

  async listAdmin(
    actorId: string,
    query: ListAdminCommentsQueryDto,
  ): Promise<PaginatedAdminCommentsResponseDto> {
    await this.ensureAdminActor(actorId);
    const result = await this.commentsRepository.listAdmin(query);
    return {
      items: result.items.map((record) =>
        CommentResponseMapper.toAdmin(record, this.toAuthorDto(record.author)),
      ),
      meta: paginationMeta(query.page, query.limit, result.total),
    };
  }

  async listPublic(
    slug: string,
    query: ListCommentsQueryDto,
  ): Promise<PaginatedCommentsResponseDto> {
    const post = await this.postsRepository.findBySlug(slug);
    if (!post) throwCommentDomainException(new PostNotOpenForCommentsError());

    const result = await this.commentsRepository.listPublicThreads({
      ...query,
      postId: post.post.id,
    });
    return {
      items: result.items.map((thread) =>
        CommentResponseMapper.toThread(
          thread,
          this.toAuthorDto(thread.author),
          thread.replies.map((reply) => this.toAuthorDto(reply.author)),
        ),
      ),
      meta: paginationMeta(query.page, query.limit, result.total),
    };
  }

  async moderate(actorId: string, id: string, dto: ModerateCommentDto) {
    await this.ensureAdminActor(actorId);
    const record = await this.requireComment(id);
    this.executeDomainAction(() => {
      if (dto.status === CommentModerationStatus.VISIBLE) record.comment.approve(new Date());
      else if (dto.status === CommentModerationStatus.HIDDEN)
        record.comment.hide(new Date(), dto.reason);
      else record.comment.markAsSpam(new Date(), dto.reason);
    });
    await this.commentsRepository.save(record.comment);
    return CommentResponseMapper.toAdmin(record, this.toAuthorDto(record.author));
  }

  async update(actorId: string, id: string, dto: UpdateCommentDto): Promise<CommentResponseDto> {
    const [record] = await Promise.all([this.requireComment(id), this.ensureActiveActor(actorId)]);
    if (record.comment.authorId !== actorId) throw new ForbiddenAccessException();

    this.executeDomainAction(() =>
      record.comment.edit(CommentContent.create(dto.content), new Date()),
    );
    await this.commentsRepository.save(record.comment);
    return CommentResponseMapper.toPublic(record, this.toAuthorDto(record.author));
  }

  private async ensureActiveActor(actorId: string): Promise<UserRole> {
    const role = await this.authorizationRepository.findActiveRoleByProfileId(actorId);
    if (!role) throw new ForbiddenAccessException();
    return role;
  }

  private async ensureAdminActor(actorId: string): Promise<void> {
    if ((await this.ensureActiveActor(actorId)) !== UserRole.ADMIN)
      throw new ForbiddenAccessException();
  }

  private async ensureValidParent(parentId: string, postId: string): Promise<void> {
    const validParent = await this.commentsRepository.findReplyParent(parentId, postId);
    if (validParent?.comment.status === CommentStatus.VISIBLE) return;

    const candidate = await this.commentsRepository.findById(parentId);
    this.executeDomainAction(() => {
      if (!candidate || candidate.comment.postId !== postId) throw new CommentParentInvalidError();
      if (candidate.comment.parentId) throw new CommentNestingLimitExceededError();
      throw new CommentParentInvalidError();
    });
  }

  private executeDomainAction<T>(action: () => T): T {
    try {
      return action();
    } catch (error) {
      throwCommentDomainException(error);
    }
  }

  private async notifyNewComment(record: CommentRecord, postTitle: string): Promise<void> {
    try {
      await this.mailService.sendNewCommentNotification({
        authorDisplayName: record.author?.displayName ?? 'Leitor',
        commentContent: record.comment.content?.value ?? '',
        commentId: record.comment.id,
        isReply: record.comment.parentId !== null,
        postTitle,
      });
    } catch (error) {
      this.logger.error(
        `Falha ao solicitar notificação do comentário ${record.comment.id}.`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private async requireComment(id: string): Promise<CommentRecord> {
    const record = await this.commentsRepository.findById(id);
    if (!record) throw new CommentNotFoundException();
    return record;
  }

  private toAuthorDto(author: CommentAuthorRecord | null): CommentAuthorDto | null {
    return author
      ? {
          avatarUrl: author.avatarPath ? this.avatarStorage.publicUrl(author.avatarPath) : null,
          displayName: author.displayName,
          id: author.id,
        }
      : null;
  }
}
