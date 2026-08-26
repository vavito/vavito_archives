import { PrismaService } from '@api/core/database/prisma.service';
import {
  CampaignStatus as PrismaCampaignStatus,
  EmailDeliveryStatus,
  Prisma,
} from '@api/generated/prisma/client';
import type { EmailCampaign } from '@api/modules/newsletter/domain/entities/email-campaign.entity';
import { EmailCampaignMapper } from '@api/modules/newsletter/mappers/email-campaign.mapper';
import {
  type CampaignDeliveryRecipient,
  type CampaignListFilters,
  type CampaignListResult,
  CampaignsRepository,
} from '@api/modules/newsletter/repositories/campaigns.repository';
import { Injectable } from '@nestjs/common';

function paginationOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

@Injectable()
export class PrismaCampaignsRepository implements CampaignsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(campaign: EmailCampaign): Promise<void> {
    await this.prisma.emailCampaign.create({ data: EmailCampaignMapper.toPersistence(campaign) });
  }

  async findById(id: string): Promise<EmailCampaign | null> {
    const record = await this.prisma.emailCampaign.findUnique({ where: { id } });
    return record ? EmailCampaignMapper.toDomain(record) : null;
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<EmailCampaign | null> {
    const record = await this.prisma.emailCampaign.findUnique({ where: { idempotencyKey } });
    return record ? EmailCampaignMapper.toDomain(record) : null;
  }

  async list(filters: CampaignListFilters): Promise<CampaignListResult> {
    const where: Prisma.EmailCampaignWhereInput = filters.status
      ? { status: PrismaCampaignStatus[filters.status] }
      : {};
    const [total, records] = await this.prisma.$transaction([
      this.prisma.emailCampaign.count({ where }),
      this.prisma.emailCampaign.findMany({
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip: paginationOffset(filters.page, filters.limit),
        take: filters.limit,
        where,
      }),
    ]);

    return { items: records.map((record) => EmailCampaignMapper.toDomain(record)), total };
  }

  async markDeliveryFailed(deliveryId: string, reason: string): Promise<void> {
    await this.prisma.emailDelivery.update({
      data: { failureReason: reason, status: EmailDeliveryStatus.FAILED },
      where: { id: deliveryId },
    });
  }

  async markDeliverySent(deliveryId: string, providerEmailId: string): Promise<void> {
    await this.prisma.emailDelivery.update({
      data: { providerEmailId, status: EmailDeliveryStatus.SENT },
      where: { id: deliveryId },
    });
  }

  async save(campaign: EmailCampaign): Promise<void> {
    await this.prisma.emailCampaign.update({
      data: EmailCampaignMapper.toUpdate(campaign),
      where: { id: campaign.id },
    });
  }

  async startSending(
    campaign: EmailCampaign,
    recipients: readonly CampaignDeliveryRecipient[],
  ): Promise<boolean> {
    return this.prisma.$transaction(async (transaction) => {
      const started = await transaction.emailCampaign.updateMany({
        data: EmailCampaignMapper.toUpdate(campaign),
        where: {
          id: campaign.id,
          idempotencyKey: null,
          status: PrismaCampaignStatus.DRAFT,
        },
      });

      if (started.count !== 1) return false;

      await transaction.emailDelivery.createMany({
        data: recipients.map((recipient) => ({
          campaignId: campaign.id,
          id: recipient.deliveryId,
          subscriberId: recipient.subscriberId,
        })),
      });

      return true;
    });
  }
}
