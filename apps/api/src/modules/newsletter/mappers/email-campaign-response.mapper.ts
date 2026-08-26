import type { EmailCampaign } from '@api/modules/newsletter/domain/entities/email-campaign.entity';
import type { EmailCampaignAdminDto } from '@api/modules/newsletter/dto/response/email-campaign-response.dto';

function nullableIso(date: Date | null): string | null {
  return date?.toISOString() ?? null;
}

export class EmailCampaignResponseMapper {
  static toAdmin(campaign: EmailCampaign): EmailCampaignAdminDto {
    return {
      audienceCount: campaign.audienceCount,
      createdAt: campaign.createdAt.toISOString(),
      createdById: campaign.createdById,
      failureReason: campaign.failureReason,
      htmlSnapshot: campaign.htmlSnapshot,
      id: campaign.id,
      idempotencyKey: campaign.idempotencyKey,
      postSnapshot: campaign.postSnapshot,
      previewText: campaign.previewText,
      resendId: campaign.resendId,
      sendStartedAt: nullableIso(campaign.sendStartedAt),
      sentAt: nullableIso(campaign.sentAt),
      status: campaign.status,
      subject: campaign.subject,
      updatedAt: campaign.updatedAt.toISOString(),
    };
  }
}
