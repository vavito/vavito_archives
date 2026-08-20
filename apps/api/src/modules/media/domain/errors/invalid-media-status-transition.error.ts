import type { MediaAssetStatus } from '@api/modules/media/domain/enums/media-asset-status.enum';

export const INVALID_MEDIA_STATUS_TRANSITION = 'INVALID_MEDIA_STATUS_TRANSITION';

export class InvalidMediaStatusTransitionError extends Error {
  readonly code = INVALID_MEDIA_STATUS_TRANSITION;

  constructor(action: string, status: MediaAssetStatus) {
    super(`Cannot ${action} a media asset with status ${status}.`);
    this.name = InvalidMediaStatusTransitionError.name;
  }
}
