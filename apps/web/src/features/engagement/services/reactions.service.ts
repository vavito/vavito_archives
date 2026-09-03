import 'client-only';

import { removeReactionAction, setReactionAction } from '../actions/reaction.actions';
import type { ReactionState, ReactionType } from '../types/reactions.types';

export class SafeReactionActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SafeReactionActionError';
  }
}

export async function saveReaction(
  slug: string,
  postId: string,
  currentReaction: ReactionType | null,
  nextReaction: ReactionType,
): Promise<ReactionState | null> {
  const result =
    currentReaction === nextReaction
      ? await removeReactionAction(slug, postId)
      : await setReactionAction(slug, postId, nextReaction);

  if (!result.ok) throw new SafeReactionActionError(result.message);
  return result.data;
}
