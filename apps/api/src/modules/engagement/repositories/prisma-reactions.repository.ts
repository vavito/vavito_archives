import { Injectable } from '@nestjs/common';

import { PrismaService } from '@api/core/database/prisma.service';
import type { Prisma } from '@api/generated/prisma/client';
import {
  PostStatus as PrismaPostStatus,
  ReactionType as PrismaReactionType,
} from '@api/generated/prisma/client';
import type { Reaction } from '@api/modules/engagement/domain/entities/reaction.entity';
import { ReactionMapper } from '@api/modules/engagement/mappers/reaction.mapper';
import {
  type ReactionCounts,
  type ReactionMutationResult,
  ReactionsRepository,
} from '@api/modules/engagement/repositories/reactions.repository';

const MAX_TRANSACTION_ATTEMPTS = 3;

function isTransactionConflict(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2034';
}

async function countReactions(
  transaction: Prisma.TransactionClient,
  postId: string,
): Promise<ReactionCounts> {
  const counts = await transaction.reaction.groupBy({
    _count: { _all: true },
    by: ['type'],
    where: { postId },
  });
  const countByType = new Map(counts.map((item) => [item.type, item._count._all]));

  return {
    dislike: countByType.get(PrismaReactionType.DISLIKE) ?? 0,
    like: countByType.get(PrismaReactionType.LIKE) ?? 0,
  };
}

@Injectable()
export class PrismaReactionsRepository implements ReactionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async set(reaction: Reaction): Promise<ReactionMutationResult> {
    return this.runTransaction(async (transaction) => {
      if (!(await this.publishedPostExists(transaction, reaction.postId))) {
        return this.postNotFoundResult();
      }

      const existingRecord = await transaction.reaction.findUnique({
        where: {
          profileId_postId: {
            postId: reaction.postId,
            profileId: reaction.profileId,
          },
        },
      });

      let persistedReaction: Reaction;

      if (!existingRecord) {
        const created = await transaction.reaction.create({
          data: ReactionMapper.toPersistence(reaction),
        });
        persistedReaction = ReactionMapper.toDomain(created);
      } else {
        persistedReaction = ReactionMapper.toDomain(existingRecord);

        if (persistedReaction.changeType(reaction.type, reaction.updatedAt)) {
          const updated = await transaction.reaction.update({
            data: ReactionMapper.toUpdate(persistedReaction),
            where: { id: persistedReaction.id },
          });
          persistedReaction = ReactionMapper.toDomain(updated);
        }
      }

      return {
        counts: await countReactions(transaction, reaction.postId),
        postExists: true,
        reaction: persistedReaction,
      };
    });
  }

  async remove(profileId: string, postId: string): Promise<ReactionMutationResult> {
    return this.runTransaction(async (transaction) => {
      if (!(await this.publishedPostExists(transaction, postId))) {
        return this.postNotFoundResult();
      }

      await transaction.reaction.deleteMany({ where: { postId, profileId } });

      return {
        counts: await countReactions(transaction, postId),
        postExists: true,
        reaction: null,
      };
    });
  }

  private async publishedPostExists(
    transaction: Prisma.TransactionClient,
    postId: string,
  ): Promise<boolean> {
    const post = await transaction.post.findFirst({
      select: { id: true },
      where: { id: postId, status: PrismaPostStatus.PUBLISHED },
    });

    return Boolean(post);
  }

  private postNotFoundResult(): ReactionMutationResult {
    return {
      counts: { dislike: 0, like: 0 },
      postExists: false,
      reaction: null,
    };
  }

  private async runTransaction(
    operation: (transaction: Prisma.TransactionClient) => Promise<ReactionMutationResult>,
  ): Promise<ReactionMutationResult> {
    for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
      try {
        return await this.prisma.$transaction(operation, { isolationLevel: 'Serializable' });
      } catch (error) {
        if (!isTransactionConflict(error) || attempt === MAX_TRANSACTION_ATTEMPTS) {
          throw error;
        }
      }
    }

    throw new Error('Reaction transaction attempts exhausted.');
  }
}
