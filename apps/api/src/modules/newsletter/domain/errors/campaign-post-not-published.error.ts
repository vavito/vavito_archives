export class CampaignPostNotPublishedError extends Error {
  readonly code = 'CAMPAIGN_POST_NOT_PUBLISHED';

  constructor() {
    super('Campaign post is not published.');
    this.name = CampaignPostNotPublishedError.name;
  }
}
