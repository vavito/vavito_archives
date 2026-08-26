import { PrismaService } from '@api/core/database/prisma.service';
import { SubscriberStatus } from '@api/generated/prisma/client';
import type { Subscriber } from '@api/modules/newsletter/domain/entities/subscriber.entity';
import { SubscriberMapper } from '@api/modules/newsletter/mappers/subscriber.mapper';
import { SubscribersRepository } from '@api/modules/newsletter/repositories/subscribers.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PrismaSubscribersRepository implements SubscribersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createIfEmailAvailable(subscriber: Subscriber): Promise<boolean> {
    const result = await this.prisma.newsletterSubscriber.createMany({
      data: SubscriberMapper.toPersistence(subscriber),
      skipDuplicates: true,
    });

    return result.count === 1;
  }

  async findByConfirmationTokenHash(tokenHash: string): Promise<Subscriber | null> {
    const record = await this.prisma.newsletterSubscriber.findUnique({
      where: { confirmationTokenHash: tokenHash },
    });

    return record ? SubscriberMapper.toDomain(record) : null;
  }

  async findByEmail(email: string): Promise<Subscriber | null> {
    const record = await this.prisma.newsletterSubscriber.findUnique({ where: { email } });

    return record ? SubscriberMapper.toDomain(record) : null;
  }

  async findByUnsubscribeTokenHash(tokenHash: string): Promise<Subscriber | null> {
    const record = await this.prisma.newsletterSubscriber.findUnique({
      where: { unsubscribeTokenHash: tokenHash },
    });

    return record ? SubscriberMapper.toDomain(record) : null;
  }

  async listEligibleForCampaign(): Promise<Subscriber[]> {
    const records = await this.prisma.newsletterSubscriber.findMany({
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      where: { status: SubscriberStatus.CONFIRMED },
    });

    return records.map((record) => SubscriberMapper.toDomain(record));
  }

  async save(subscriber: Subscriber): Promise<void> {
    await this.prisma.newsletterSubscriber.update({
      data: SubscriberMapper.toUpdate(subscriber),
      where: { id: subscriber.id },
    });
  }
}
