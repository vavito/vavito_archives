export class CampaignContentInvalidError extends Error {
  readonly code = 'CAMPAIGN_CONTENT_INVALID';

  constructor() {
    super('Campaign content is invalid.');
    this.name = CampaignContentInvalidError.name;
  }
}
