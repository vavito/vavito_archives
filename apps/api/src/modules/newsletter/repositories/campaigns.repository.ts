import type { EmailCampaign } from '@api/modules/newsletter/domain/entities/email-campaign.entity';
import type { CampaignStatus } from '@api/modules/newsletter/domain/enums/campaign-status.enum';

export interface CampaignListFilters {
  limit: number;
  page: number;
  status?: CampaignStatus;
}

export interface CampaignListResult {
  items: EmailCampaign[];
  total: number;
}

export interface CampaignDeliveryRecipient {
  deliveryId: string;
  subscriberId: string;
}

export abstract class CampaignsRepository {
  abstract create(campaign: EmailCampaign): Promise<void>;
  abstract findById(id: string): Promise<EmailCampaign | null>;
  abstract findByIdempotencyKey(idempotencyKey: string): Promise<EmailCampaign | null>;
  abstract list(filters: CampaignListFilters): Promise<CampaignListResult>;
  abstract markDeliveryFailed(deliveryId: string, reason: string): Promise<void>;
  abstract markDeliverySent(deliveryId: string, providerEmailId: string): Promise<void>;
  abstract save(campaign: EmailCampaign): Promise<void>;
  abstract startSending(
    campaign: EmailCampaign,
    recipients: readonly CampaignDeliveryRecipient[],
  ): Promise<boolean>;
}
