import type { EmailCampaign as PrismaEmailCampaign, Prisma } from '@api/generated/prisma/client';
import { CampaignStatus as PrismaCampaignStatus } from '@api/generated/prisma/client';
import {
  EmailCampaign,
  type CampaignPostSnapshot,
} from '@api/modules/newsletter/domain/entities/email-campaign.entity';
import { CampaignStatus } from '@api/modules/newsletter/domain/enums/campaign-status.enum';

const campaignStatusByPrisma: Readonly<Record<PrismaCampaignStatus, CampaignStatus>> = {
  [PrismaCampaignStatus.DRAFT]: CampaignStatus.DRAFT,
  [PrismaCampaignStatus.FAILED]: CampaignStatus.FAILED,
  [PrismaCampaignStatus.SENDING]: CampaignStatus.SENDING,
  [PrismaCampaignStatus.SENT]: CampaignStatus.SENT,
};

export class EmailCampaignMapper {
  static toDomain(record: PrismaEmailCampaign): EmailCampaign {
    return EmailCampaign.restore({
      audienceCount: record.audienceCount,
      createdAt: record.createdAt,
      createdById: record.createdById,
      failureReason: record.failureReason,
      htmlSnapshot: record.htmlSnapshot,
      id: record.id,
      idempotencyKey: record.idempotencyKey,
      postId: record.postId,
      postSnapshot: structuredClone(record.postSnapshot) as CampaignPostSnapshot,
      previewText: record.previewText,
      resendId: record.resendId,
      sendStartedAt: record.sendStartedAt,
      sentAt: record.sentAt,
      status: campaignStatusByPrisma[record.status],
      subject: record.subject,
      updatedAt: record.updatedAt,
    });
  }

  static toPersistence(campaign: EmailCampaign): Prisma.EmailCampaignUncheckedCreateInput {
    return {
      audienceCount: campaign.audienceCount,
      createdAt: campaign.createdAt,
      createdById: campaign.createdById,
      failureReason: campaign.failureReason,
      htmlSnapshot: campaign.htmlSnapshot,
      id: campaign.id,
      idempotencyKey: campaign.idempotencyKey,
      postId: campaign.postId,
      postSnapshot: campaign.postSnapshot as Prisma.InputJsonObject,
      previewText: campaign.previewText,
      resendId: campaign.resendId,
      sendStartedAt: campaign.sendStartedAt,
      sentAt: campaign.sentAt,
      status: PrismaCampaignStatus[campaign.status],
      subject: campaign.subject,
      updatedAt: campaign.updatedAt,
    };
  }

  static toUpdate(campaign: EmailCampaign): Prisma.EmailCampaignUncheckedUpdateInput {
    return {
      audienceCount: campaign.audienceCount,
      failureReason: campaign.failureReason,
      htmlSnapshot: campaign.htmlSnapshot,
      idempotencyKey: campaign.idempotencyKey,
      postSnapshot: campaign.postSnapshot as Prisma.InputJsonObject,
      previewText: campaign.previewText,
      resendId: campaign.resendId,
      sendStartedAt: campaign.sendStartedAt,
      sentAt: campaign.sentAt,
      status: PrismaCampaignStatus[campaign.status],
      subject: campaign.subject,
      updatedAt: campaign.updatedAt,
    };
  }
}
