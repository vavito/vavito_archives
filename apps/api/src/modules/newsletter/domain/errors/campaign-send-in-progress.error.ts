export class CampaignSendInProgressError extends Error {
  readonly code = 'CAMPAIGN_SEND_IN_PROGRESS';

  constructor() {
    super('Campaign send is already in progress.');
    this.name = CampaignSendInProgressError.name;
  }
}
