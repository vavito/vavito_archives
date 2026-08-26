import { EmailDeliveryStatus as PrismaEmailDeliveryStatus } from '@api/generated/prisma/client';
import { EmailDeliveryStatus } from '@api/modules/newsletter/domain/enums/email-delivery-status.enum';
import { EmailDeliveryMapper } from '@api/modules/newsletter/mappers/email-delivery.mapper';

const CREATED_AT = new Date('2026-08-25T10:00:00.000Z');
const EVENT_AT = new Date('2026-08-25T10:05:00.000Z');

describe('EmailDeliveryMapper', () => {
  it('restaura a entrega com o estado persistido', () => {
    const delivery = EmailDeliveryMapper.toDomain({
      campaignId: '0b68ee40-f392-49cb-95c4-dd19cdd1bd43',
      createdAt: CREATED_AT,
      failureCode: 'delivery_delayed',
      failureReason: 'Atraso temporário.',
      id: '49244eb5-fd04-438f-8d1d-a42e318c9bcd',
      lastEventAt: EVENT_AT,
      providerEmailId: 'email-provider-id',
      status: PrismaEmailDeliveryStatus.DELIVERY_DELAYED,
      subscriberId: '2813645a-8b74-4d1f-96c3-72cf3c594ad3',
      updatedAt: EVENT_AT,
    });

    expect(delivery.status).toBe(EmailDeliveryStatus.DELIVERY_DELAYED);
    expect(delivery.lastEventAt).toEqual(EVENT_AT);
    expect(delivery.failureCode).toBe('delivery_delayed');
  });

  it('mapeia somente os campos alteráveis da entrega', () => {
    const delivery = EmailDeliveryMapper.toDomain({
      campaignId: '0b68ee40-f392-49cb-95c4-dd19cdd1bd43',
      createdAt: CREATED_AT,
      failureCode: null,
      failureReason: null,
      id: '49244eb5-fd04-438f-8d1d-a42e318c9bcd',
      lastEventAt: null,
      providerEmailId: 'email-provider-id',
      status: PrismaEmailDeliveryStatus.SENT,
      subscriberId: '2813645a-8b74-4d1f-96c3-72cf3c594ad3',
      updatedAt: CREATED_AT,
    });
    delivery.applyProviderEvent({
      failureCode: null,
      failureReason: null,
      occurredAt: EVENT_AT,
      status: EmailDeliveryStatus.DELIVERED,
    });

    expect(EmailDeliveryMapper.toUpdate(delivery)).toEqual({
      failureCode: null,
      failureReason: null,
      lastEventAt: EVENT_AT,
      status: PrismaEmailDeliveryStatus.DELIVERED,
      updatedAt: EVENT_AT,
    });
  });
});
