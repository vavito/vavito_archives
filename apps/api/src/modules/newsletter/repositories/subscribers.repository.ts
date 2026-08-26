import type { Subscriber } from '@api/modules/newsletter/domain/entities/subscriber.entity';

export abstract class SubscribersRepository {
  abstract createIfEmailAvailable(subscriber: Subscriber): Promise<boolean>;
  abstract findByConfirmationTokenHash(tokenHash: string): Promise<Subscriber | null>;
  abstract findByEmail(email: string): Promise<Subscriber | null>;
  abstract findByUnsubscribeTokenHash(tokenHash: string): Promise<Subscriber | null>;
  abstract listEligibleForCampaign(): Promise<Subscriber[]>;
  abstract save(subscriber: Subscriber): Promise<void>;
}
