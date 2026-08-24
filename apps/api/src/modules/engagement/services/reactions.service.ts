import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { ForbiddenAccessException } from '@api/core/auth/errors/forbidden-access.exception';
import { ProfileAuthorizationRepository } from '@api/core/auth/repositories/profile-authorization.repository';
import { Reaction } from '@api/modules/engagement/domain/entities/reaction.entity';
import type { ReactionType } from '@api/modules/engagement/domain/enums/reaction-type.enum';
import type { ReactionCounts } from '@api/modules/engagement/repositories/reactions.repository';
import { ReactionsRepository } from '@api/modules/engagement/repositories/reactions.repository';
import { PostNotFoundException } from '@api/modules/posts/errors/post-not-found.exception';

export interface ReactionState {
  counts: ReactionCounts;
  currentType: ReactionType | null;
}

@Injectable()
export class ReactionsService {
  constructor(
    private readonly reactionsRepository: ReactionsRepository,
    private readonly profileAuthorizationRepository: ProfileAuthorizationRepository,
  ) {}

  async set(profileId: string, postId: string, type: ReactionType): Promise<ReactionState> {
    await this.ensureActiveProfile(profileId);
    const result = await this.reactionsRepository.set(
      Reaction.create({ id: randomUUID(), now: new Date(), postId, profileId, type }),
    );

    return this.toState(result);
  }

  async remove(profileId: string, postId: string): Promise<ReactionState> {
    await this.ensureActiveProfile(profileId);
    return this.toState(await this.reactionsRepository.remove(profileId, postId));
  }

  private async ensureActiveProfile(profileId: string): Promise<void> {
    if (!(await this.profileAuthorizationRepository.findActiveRoleByProfileId(profileId))) {
      throw new ForbiddenAccessException();
    }
  }

  private toState(result: Awaited<ReturnType<ReactionsRepository['set']>>): ReactionState {
    if (!result.postExists) {
      throw new PostNotFoundException();
    }

    return {
      counts: result.counts,
      currentType: result.reaction?.type ?? null,
    };
  }
}
