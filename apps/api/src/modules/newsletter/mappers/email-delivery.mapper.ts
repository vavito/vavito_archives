import type { EmailDelivery as PrismaEmailDelivery, Prisma } from '@api/generated/prisma/client';
import { EmailDeliveryStatus as PrismaEmailDeliveryStatus } from '@api/generated/prisma/client';
import { EmailDelivery } from '@api/modules/newsletter/domain/entities/email-delivery.entity';
import { EmailDeliveryStatus } from '@api/modules/newsletter/domain/enums/email-delivery-status.enum';

const domainStatusByPrisma: Readonly<Record<PrismaEmailDeliveryStatus, EmailDeliveryStatus>> = {
  [PrismaEmailDeliveryStatus.BOUNCED]: EmailDeliveryStatus.BOUNCED,
  [PrismaEmailDeliveryStatus.COMPLAINED]: EmailDeliveryStatus.COMPLAINED,
  [PrismaEmailDeliveryStatus.DELIVERED]: EmailDeliveryStatus.DELIVERED,
  [PrismaEmailDeliveryStatus.DELIVERY_DELAYED]: EmailDeliveryStatus.DELIVERY_DELAYED,
  [PrismaEmailDeliveryStatus.FAILED]: EmailDeliveryStatus.FAILED,
  [PrismaEmailDeliveryStatus.QUEUED]: EmailDeliveryStatus.QUEUED,
  [PrismaEmailDeliveryStatus.SENT]: EmailDeliveryStatus.SENT,
  [PrismaEmailDeliveryStatus.SUPPRESSED]: EmailDeliveryStatus.SUPPRESSED,
};

const prismaStatusByDomain: Readonly<Record<EmailDeliveryStatus, PrismaEmailDeliveryStatus>> = {
  [EmailDeliveryStatus.BOUNCED]: PrismaEmailDeliveryStatus.BOUNCED,
  [EmailDeliveryStatus.COMPLAINED]: PrismaEmailDeliveryStatus.COMPLAINED,
  [EmailDeliveryStatus.DELIVERED]: PrismaEmailDeliveryStatus.DELIVERED,
  [EmailDeliveryStatus.DELIVERY_DELAYED]: PrismaEmailDeliveryStatus.DELIVERY_DELAYED,
  [EmailDeliveryStatus.FAILED]: PrismaEmailDeliveryStatus.FAILED,
  [EmailDeliveryStatus.QUEUED]: PrismaEmailDeliveryStatus.QUEUED,
  [EmailDeliveryStatus.SENT]: PrismaEmailDeliveryStatus.SENT,
  [EmailDeliveryStatus.SUPPRESSED]: PrismaEmailDeliveryStatus.SUPPRESSED,
};

export class EmailDeliveryMapper {
  static toDomain(record: PrismaEmailDelivery): EmailDelivery {
    return EmailDelivery.restore({
      campaignId: record.campaignId,
      createdAt: record.createdAt,
      failureCode: record.failureCode,
      failureReason: record.failureReason,
      id: record.id,
      lastEventAt: record.lastEventAt,
      providerEmailId: record.providerEmailId,
      status: domainStatusByPrisma[record.status],
      subscriberId: record.subscriberId,
      updatedAt: record.updatedAt,
    });
  }

  static toUpdate(delivery: EmailDelivery): Prisma.EmailDeliveryUpdateManyMutationInput {
    return {
      failureCode: delivery.failureCode,
      failureReason: delivery.failureReason,
      lastEventAt: delivery.lastEventAt,
      status: prismaStatusByDomain[delivery.status],
      updatedAt: delivery.updatedAt,
    };
  }
}
