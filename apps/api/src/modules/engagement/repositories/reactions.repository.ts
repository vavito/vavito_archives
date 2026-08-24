import type { Reaction } from '@api/modules/engagement/domain/entities/reaction.entity';

export interface ReactionCounts {
  dislike: number;
  like: number;
}

export interface ReactionMutationResult {
  counts: ReactionCounts;
  postExists: boolean;
  reaction: Reaction | null;
}

export abstract class ReactionsRepository {
  abstract remove(profileId: string, postId: string): Promise<ReactionMutationResult>;
  abstract set(reaction: Reaction): Promise<ReactionMutationResult>;
}
