import type { EmailCampaign } from '@api/modules/newsletter/domain/entities/email-campaign.entity';
import type {
  CampaignPostSnapshotDto,
  EmailCampaignAdminDto,
} from '@api/modules/newsletter/dto/response/email-campaign-response.dto';
import type { CampaignPostSnapshot } from '@api/modules/newsletter/domain/entities/email-campaign.entity';

function nullableIso(date: Date | null): string | null {
  return date?.toISOString() ?? null;
}

function snapshotResponse(snapshot: CampaignPostSnapshot): CampaignPostSnapshotDto {
  return {
    coverAlt: snapshot.coverAlt ?? null,
    coverUrl: snapshot.coverUrl ?? null,
    excerpt: snapshot.excerpt,
    id: snapshot.id,
    publishedAt: snapshot.publishedAt,
    readingTimeMinutes: snapshot.readingTimeMinutes,
    slug: snapshot.slug,
    title: snapshot.title,
  };
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
      postSnapshot: snapshotResponse(campaign.postSnapshot),
      postSnapshots: campaign.postSnapshots.map(snapshotResponse),
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
