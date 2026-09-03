import type { components } from '@vavito/api-client';

export type ReactionType = components['schemas']['ReactionType'];
export type ReactionCounts = components['schemas']['ReactionCountsDto'];
export type ReactionState = components['schemas']['ReactionResponseDto'];

export type ReactionActionResult =
  { data: ReactionState | null; ok: true } | { message: string; ok: false };
