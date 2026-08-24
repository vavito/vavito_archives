import type {
  BookmarkResponseDto,
  ReactionResponseDto,
} from '@api/modules/engagement/dto/response/engagement-response.dto';
import type { ReactionState } from '@api/modules/engagement/services/reactions.service';

export class EngagementResponseMapper {
  static toReaction(state: ReactionState): ReactionResponseDto {
    return {
      counts: { ...state.counts },
      reaction: state.currentType,
    };
  }

  static toBookmark(): BookmarkResponseDto {
    return { bookmarked: true };
  }
}
