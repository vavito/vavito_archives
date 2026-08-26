import { EmailDelivery } from '@api/modules/newsletter/domain/entities/email-delivery.entity';
import { EmailDeliveryStatus } from '@api/modules/newsletter/domain/enums/email-delivery-status.enum';

const CREATED_AT = new Date('2026-08-26T10:00:00.000Z');

function delivery(status = EmailDeliveryStatus.SENT, lastEventAt: Date | null = null) {
  return EmailDelivery.restore({
    campaignId: '7ace9bf1-9c6c-451d-bd29-922390e799a5',
    createdAt: CREATED_AT,
    failureCode: null,
    failureReason: null,
    id: 'b5c86dcb-6a38-484d-ab44-a4c4d8ddc5c8',
    lastEventAt,
    providerEmailId: 'resend-email-id',
    status,
    subscriberId: '9a537a71-d0dc-4665-a60c-801152e8f2a2',
    updatedAt: lastEventAt ?? CREATED_AT,
  });
}

describe('EmailDelivery', () => {
  it('registra atraso e depois entrega quando o evento é mais recente', () => {
    const item = delivery();
    item.applyProviderEvent({
      failureCode: 'delivery_delayed',
      failureReason: 'Atraso temporário.',
      occurredAt: new Date('2026-08-26T11:00:00.000Z'),
      status: EmailDeliveryStatus.DELIVERY_DELAYED,
    });
    expect(item.status).toBe(EmailDeliveryStatus.DELIVERY_DELAYED);

    item.applyProviderEvent({
      failureCode: null,
      failureReason: null,
      occurredAt: new Date('2026-08-26T12:00:00.000Z'),
      status: EmailDeliveryStatus.DELIVERED,
    });
    expect(item.status).toBe(EmailDeliveryStatus.DELIVERED);
    expect(item.failureCode).toBeNull();
  });

  it('ignora evento antigo sem alterar o estado', () => {
    const item = delivery(EmailDeliveryStatus.DELIVERED, new Date('2026-08-26T12:00:00.000Z'));

    expect(
      item.applyProviderEvent({
        failureCode: 'delivery_delayed',
        failureReason: 'Atraso temporário.',
        occurredAt: new Date('2026-08-26T11:00:00.000Z'),
        status: EmailDeliveryStatus.DELIVERY_DELAYED,
      }),
    ).toBe(false);
    expect(item.status).toBe(EmailDeliveryStatus.DELIVERED);
  });

  it('não retrocede updatedAt quando o provedor criou o evento antes da persistência local', () => {
    const persistedAt = new Date('2026-08-26T10:02:00.000Z');
    const eventAt = new Date('2026-08-26T10:01:00.000Z');
    const item = EmailDelivery.restore({
      campaignId: '7ace9bf1-9c6c-451d-bd29-922390e799a5',
      createdAt: CREATED_AT,
      failureCode: null,
      failureReason: null,
      id: 'b5c86dcb-6a38-484d-ab44-a4c4d8ddc5c8',
      lastEventAt: null,
      providerEmailId: 'resend-email-id',
      status: EmailDeliveryStatus.SENT,
      subscriberId: '9a537a71-d0dc-4665-a60c-801152e8f2a2',
      updatedAt: persistedAt,
    });

    expect(
      item.applyProviderEvent({
        failureCode: null,
        failureReason: null,
        occurredAt: eventAt,
        status: EmailDeliveryStatus.DELIVERED,
      }),
    ).toBe(true);
    expect(item.lastEventAt).toEqual(eventAt);
    expect(item.updatedAt).toEqual(persistedAt);
  });

  it('mantém complaint terminal e permite complaint após bounce', () => {
    const bounced = delivery(EmailDeliveryStatus.BOUNCED);
    expect(
      bounced.applyProviderEvent({
        failureCode: 'complained',
        failureReason: 'Spam.',
        occurredAt: new Date('2026-08-26T12:00:00.000Z'),
        status: EmailDeliveryStatus.COMPLAINED,
      }),
    ).toBe(true);

    expect(
      bounced.applyProviderEvent({
        failureCode: null,
        failureReason: null,
        occurredAt: new Date('2026-08-26T13:00:00.000Z'),
        status: EmailDeliveryStatus.DELIVERED,
      }),
    ).toBe(false);
    expect(bounced.status).toBe(EmailDeliveryStatus.COMPLAINED);
  });
});
