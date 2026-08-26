import type { CampaignStatus } from '@api/modules/newsletter/domain/enums/campaign-status.enum';

export class InvalidCampaignStatusTransitionError extends Error {
  readonly code = 'INVALID_CAMPAIGN_STATUS_TRANSITION';

  constructor(action: string, status: CampaignStatus) {
    super(`Cannot ${action} campaign in status ${status}.`);
    this.name = InvalidCampaignStatusTransitionError.name;
  }
}
