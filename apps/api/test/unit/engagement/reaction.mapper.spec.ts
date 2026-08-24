import {
  ReactionType as PrismaReactionType,
  type Reaction as PrismaReaction,
} from '@api/generated/prisma/client';
import { Reaction } from '@api/modules/engagement/domain/entities/reaction.entity';
import { ReactionType } from '@api/modules/engagement/domain/enums/reaction-type.enum';
import { ReactionMapper } from '@api/modules/engagement/mappers/reaction.mapper';

const CREATED_AT = new Date('2026-08-23T10:00:00.000Z');

function prismaReaction(): PrismaReaction {
  return {
    createdAt: CREATED_AT,
    id: 'reaction-id',
    postId: 'post-id',
    profileId: 'profile-id',
    type: PrismaReactionType.DISLIKE,
    updatedAt: CREATED_AT,
  };
}

describe('ReactionMapper', () => {
  it('restaura a entidade a partir do registro Prisma', () => {
    expect(ReactionMapper.toDomain(prismaReaction())).toMatchObject({
      id: 'reaction-id',
      postId: 'post-id',
      profileId: 'profile-id',
      type: ReactionType.DISLIKE,
    });
  });

  it('converte a entidade para criação e atualização no Prisma', () => {
    const reaction = Reaction.create({
      id: 'reaction-id',
      now: CREATED_AT,
      postId: 'post-id',
      profileId: 'profile-id',
      type: ReactionType.LIKE,
    });

    expect(ReactionMapper.toPersistence(reaction)).toEqual({
      createdAt: CREATED_AT,
      id: 'reaction-id',
      postId: 'post-id',
      profileId: 'profile-id',
      type: PrismaReactionType.LIKE,
      updatedAt: CREATED_AT,
    });
    expect(ReactionMapper.toUpdate(reaction)).toEqual({
      type: PrismaReactionType.LIKE,
      updatedAt: CREATED_AT,
    });
  });
});
