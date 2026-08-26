import { PrismaService } from '@api/core/database/prisma.service';
import type { Prisma } from '@api/generated/prisma/client';
import { EmailDeliveryMapper } from '@api/modules/newsletter/mappers/email-delivery.mapper';
import { SubscriberMapper } from '@api/modules/newsletter/mappers/subscriber.mapper';
import {
  type ProcessWebhookEventCommand,
  type WebhookDeliveryContext,
  WebhookEventsRepository,
  WebhookProcessingResult,
} from '@api/modules/newsletter/repositories/webhook-events.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PrismaWebhookEventsRepository implements WebhookEventsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findDeliveryContextByProviderEmailId(
    providerEmailId: string,
  ): Promise<WebhookDeliveryContext | null> {
    const record = await this.prisma.emailDelivery.findUnique({
      include: { subscriber: true },
      where: { providerEmailId },
    });

    return record
      ? {
          delivery: EmailDeliveryMapper.toDomain(record),
          subscriber: SubscriberMapper.toDomain(record.subscriber),
        }
      : null;
  }

  async process(command: ProcessWebhookEventCommand): Promise<WebhookProcessingResult> {
    return this.prisma.$transaction(async (transaction) => {
      const inserted = await transaction.webhookEvent.createMany({
        data: {
          deliveryId: command.deliveryId,
          occurredAt: command.event.occurredAt,
          payloadHash: command.event.payloadHash,
          providerEventId: command.event.providerEventId,
          type: command.event.type,
        },
        skipDuplicates: true,
      });

      if (inserted.count === 0) {
        const previous = await transaction.webhookEvent.findUnique({
          select: { payloadHash: true },
          where: { providerEventId: command.event.providerEventId },
        });
        return previous?.payloadHash === command.event.payloadHash
          ? WebhookProcessingResult.DUPLICATE
          : WebhookProcessingResult.CONFLICT;
      }

      if (command.deliveryUpdate) {
        const deliveryUpdated = await transaction.emailDelivery.updateMany({
          data: EmailDeliveryMapper.toUpdate(command.deliveryUpdate),
          where: {
            id: command.deliveryUpdate.id,
            OR: [{ lastEventAt: null }, { lastEventAt: { lt: command.event.occurredAt } }],
          },
        });

        if (deliveryUpdated.count === 0) {
          await this.markProcessed(transaction, command.event.providerEventId);
          return WebhookProcessingResult.STALE;
        }

        if (command.subscriberUpdate && command.expectedSubscriberUpdatedAt) {
          const subscriberUpdated = await transaction.newsletterSubscriber.updateMany({
            data: SubscriberMapper.toUpdate(command.subscriberUpdate),
            where: {
              id: command.subscriberUpdate.id,
              updatedAt: command.expectedSubscriberUpdatedAt,
            },
          });

          if (subscriberUpdated.count !== 1) {
            throw new Error('Subscriber changed while processing a webhook event.');
          }
        }
      }

      await this.markProcessed(transaction, command.event.providerEventId);
      return WebhookProcessingResult.PROCESSED;
    });
  }

  private async markProcessed(
    transaction: Prisma.TransactionClient,
    providerEventId: string,
  ): Promise<void> {
    await transaction.webhookEvent.update({
      data: { processedAt: new Date() },
      where: { providerEventId },
    });
  }
}
