export class CampaignStateInconsistentError extends Error {
  readonly code = 'CAMPAIGN_STATE_INCONSISTENT';

  constructor() {
    super('Campaign state is inconsistent.');
    this.name = CampaignStateInconsistentError.name;
  }
}
