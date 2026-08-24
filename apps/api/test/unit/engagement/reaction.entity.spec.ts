import { Reaction } from '@api/modules/engagement/domain/entities/reaction.entity';
import { ReactionType } from '@api/modules/engagement/domain/enums/reaction-type.enum';

const CREATED_AT = new Date('2026-08-23T10:00:00.000Z');
const UPDATED_AT = new Date('2026-08-23T11:00:00.000Z');

describe('Reaction', () => {
  it('cria uma reação com timestamps consistentes', () => {
    const reaction = Reaction.create({
      id: 'reaction-id',
      now: CREATED_AT,
      postId: 'post-id',
      profileId: 'profile-id',
      type: ReactionType.LIKE,
    });

    expect(reaction).toMatchObject({
      id: 'reaction-id',
      postId: 'post-id',
      profileId: 'profile-id',
      type: ReactionType.LIKE,
    });
    expect(reaction.createdAt).toEqual(CREATED_AT);
    expect(reaction.updatedAt).toEqual(CREATED_AT);
  });

  it('troca o tipo e atualiza a data da reação', () => {
    const reaction = Reaction.create({
      id: 'reaction-id',
      now: CREATED_AT,
      postId: 'post-id',
      profileId: 'profile-id',
      type: ReactionType.LIKE,
    });

    expect(reaction.changeType(ReactionType.DISLIKE, UPDATED_AT)).toBe(true);
    expect(reaction.type).toBe(ReactionType.DISLIKE);
    expect(reaction.updatedAt).toEqual(UPDATED_AT);
  });

  it('mantém a reação inalterada quando o tipo já está ativo', () => {
    const reaction = Reaction.create({
      id: 'reaction-id',
      now: CREATED_AT,
      postId: 'post-id',
      profileId: 'profile-id',
      type: ReactionType.LIKE,
    });

    expect(reaction.changeType(ReactionType.LIKE, UPDATED_AT)).toBe(false);
    expect(reaction.updatedAt).toEqual(CREATED_AT);
  });
});
