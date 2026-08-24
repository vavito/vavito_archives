import type { ProfileAuthorizationRepository } from '@api/core/auth/repositories/profile-authorization.repository';
import { ForbiddenAccessException } from '@api/core/auth/errors/forbidden-access.exception';
import { UserRole } from '@api/generated/prisma/client';
import { Reaction } from '@api/modules/engagement/domain/entities/reaction.entity';
import { ReactionType } from '@api/modules/engagement/domain/enums/reaction-type.enum';
import type {
  ReactionMutationResult,
  ReactionsRepository,
} from '@api/modules/engagement/repositories/reactions.repository';
import { ReactionsService } from '@api/modules/engagement/services/reactions.service';
import { PostNotFoundException } from '@api/modules/posts/errors/post-not-found.exception';

const PROFILE_ID = '3d46ab51-60b3-4604-a5f1-e2c403cb75f8';
const POST_ID = '9de46532-a170-46c0-90dd-0b3cbf7794be';
const NOW = new Date('2026-08-23T10:00:00.000Z');

function persistedReaction(type: ReactionType): Reaction {
  return Reaction.create({
    id: 'df23c92d-71e4-400b-805e-975bbc3e1788',
    now: NOW,
    postId: POST_ID,
    profileId: PROFILE_ID,
    type,
  });
}

function result(overrides: Partial<ReactionMutationResult> = {}): ReactionMutationResult {
  return {
    counts: { dislike: 1, like: 3 },
    postExists: true,
    reaction: persistedReaction(ReactionType.LIKE),
    ...overrides,
  };
}

describe('ReactionsService', () => {
  const set = jest.fn<Promise<ReactionMutationResult>, [Reaction]>();
  const remove = jest.fn<Promise<ReactionMutationResult>, [string, string]>();
  const findActiveRoleByProfileId = jest.fn<Promise<UserRole | null>, [string]>();
  const repository = { remove, set } as unknown as ReactionsRepository;
  const authorizationRepository = {
    findActiveRoleByProfileId,
  } as unknown as ProfileAuthorizationRepository;
  const service = new ReactionsService(repository, authorizationRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    findActiveRoleByProfileId.mockResolvedValue(UserRole.USER);
  });

  it('define a reação do perfil ativo e retorna o estado atual', async () => {
    set.mockResolvedValue(result());

    await expect(service.set(PROFILE_ID, POST_ID, ReactionType.LIKE)).resolves.toEqual({
      counts: { dislike: 1, like: 3 },
      currentType: ReactionType.LIKE,
    });
    expect(set.mock.calls[0]?.[0]).toMatchObject({
      postId: POST_ID,
      profileId: PROFILE_ID,
      type: ReactionType.LIKE,
    });
  });

  it('remove a reação e retorna o estado sem seleção', async () => {
    remove.mockResolvedValue(result({ reaction: null }));

    await expect(service.remove(PROFILE_ID, POST_ID)).resolves.toEqual({
      counts: { dislike: 1, like: 3 },
      currentType: null,
    });
  });

  it('rejeita perfil inexistente ou excluído antes da persistência', async () => {
    findActiveRoleByProfileId.mockResolvedValue(null);

    await expect(service.set(PROFILE_ID, POST_ID, ReactionType.LIKE)).rejects.toBeInstanceOf(
      ForbiddenAccessException,
    );
    expect(set).not.toHaveBeenCalled();
  });

  it('não revela posts ausentes ou não publicados', async () => {
    set.mockResolvedValue(result({ postExists: false, reaction: null }));

    await expect(service.set(PROFILE_ID, POST_ID, ReactionType.LIKE)).rejects.toBeInstanceOf(
      PostNotFoundException,
    );
  });
});
