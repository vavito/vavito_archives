import type { Prisma, Reaction as PrismaReaction } from '@api/generated/prisma/client';
import { ReactionType as PrismaReactionType } from '@api/generated/prisma/client';
import { Reaction } from '@api/modules/engagement/domain/entities/reaction.entity';
import { ReactionType } from '@api/modules/engagement/domain/enums/reaction-type.enum';

const domainTypeByPrisma: Readonly<Record<PrismaReactionType, ReactionType>> = {
  [PrismaReactionType.DISLIKE]: ReactionType.DISLIKE,
  [PrismaReactionType.LIKE]: ReactionType.LIKE,
};

const prismaTypeByDomain: Readonly<Record<ReactionType, PrismaReactionType>> = {
  [ReactionType.DISLIKE]: PrismaReactionType.DISLIKE,
  [ReactionType.LIKE]: PrismaReactionType.LIKE,
};

export class ReactionMapper {
  static toDomain(record: PrismaReaction): Reaction {
    return Reaction.restore({
      createdAt: record.createdAt,
      id: record.id,
      postId: record.postId,
      profileId: record.profileId,
      type: domainTypeByPrisma[record.type],
      updatedAt: record.updatedAt,
    });
  }

  static toPersistence(reaction: Reaction): Prisma.ReactionUncheckedCreateInput {
    return {
      createdAt: reaction.createdAt,
      id: reaction.id,
      postId: reaction.postId,
      profileId: reaction.profileId,
      type: prismaTypeByDomain[reaction.type],
      updatedAt: reaction.updatedAt,
    };
  }

  static toUpdate(reaction: Reaction): Prisma.ReactionUncheckedUpdateInput {
    return {
      type: prismaTypeByDomain[reaction.type],
      updatedAt: reaction.updatedAt,
    };
  }
}
