export class CampaignAudienceEmptyError extends Error {
  readonly code = 'CAMPAIGN_AUDIENCE_EMPTY';

  constructor() {
    super('Campaign audience is empty.');
    this.name = CampaignAudienceEmptyError.name;
  }
}
