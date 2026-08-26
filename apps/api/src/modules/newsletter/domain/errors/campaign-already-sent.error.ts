export class CampaignAlreadySentError extends Error {
  readonly code = 'CAMPAIGN_ALREADY_SENT';

  constructor() {
    super('Campaign was already sent.');
    this.name = CampaignAlreadySentError.name;
  }
}
