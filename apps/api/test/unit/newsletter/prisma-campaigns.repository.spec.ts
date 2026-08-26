import type { PrismaService } from '@api/core/database/prisma.service';
import { CampaignStatus as PrismaCampaignStatus } from '@api/generated/prisma/client';
import type { Prisma } from '@api/generated/prisma/client';
import { EmailCampaign } from '@api/modules/newsletter/domain/entities/email-campaign.entity';
import { PrismaCampaignsRepository } from '@api/modules/newsletter/repositories/prisma-campaigns.repository';

function sendingCampaign(): EmailCampaign {
  const campaign = EmailCampaign.create({
    createdById: '501b31f5-9918-4614-a38e-fb307406be88',
    htmlSnapshot: '<html>{{unsubscribeUrl}}</html>',
    id: '0b68ee40-f392-49cb-95c4-dd19cdd1bd43',
    now: new Date('2026-08-25T10:00:00.000Z'),
    postId: 'bbd448e1-20bf-4fb3-aa26-f1ff9e7194f6',
    postSnapshot: {
      excerpt: 'Resumo',
      id: 'bbd448e1-20bf-4fb3-aa26-f1ff9e7194f6',
      publishedAt: '2026-08-24T12:00:00.000Z',
      readingTimeMinutes: 5,
      slug: 'artigo',
      title: 'Artigo',
    },
    previewText: 'Preview',
    subject: 'Assunto',
  });
  campaign.startSending({
    audienceCount: 1,
    idempotencyKey: 'e1903668-2b3e-4df8-b945-eddb4ef53f90',
    now: new Date('2026-08-25T10:01:00.000Z'),
  });
  return campaign;
}

describe('PrismaCampaignsRepository', () => {
  const updateMany = jest.fn<Promise<Prisma.BatchPayload>, [Prisma.EmailCampaignUpdateManyArgs]>();
  const createMany = jest.fn<Promise<Prisma.BatchPayload>, [Prisma.EmailDeliveryCreateManyArgs]>();
  const transaction = {
    emailCampaign: { updateMany },
    emailDelivery: { createMany },
  };
  const $transaction = jest.fn((callback: (client: typeof transaction) => Promise<boolean>) =>
    callback(transaction),
  );
  const prisma = { $transaction } as unknown as PrismaService;
  const repository = new PrismaCampaignsRepository(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
    updateMany.mockResolvedValue({ count: 1 });
    createMany.mockResolvedValue({ count: 1 });
  });

  it('congela a campanha e cria entregas na mesma transação', async () => {
    const campaign = sendingCampaign();
    const recipients = [
      {
        deliveryId: '49244eb5-fd04-438f-8d1d-a42e318c9bcd',
        subscriberId: '2813645a-8b74-4d1f-96c3-72cf3c594ad3',
      },
    ];

    await expect(repository.startSending(campaign, recipients)).resolves.toBe(true);
    const updateArgs = updateMany.mock.calls[0]?.[0];
    expect(updateArgs?.data).toMatchObject({
      idempotencyKey: 'e1903668-2b3e-4df8-b945-eddb4ef53f90',
      status: PrismaCampaignStatus.SENDING,
    });
    expect(updateArgs?.where).toMatchObject({ status: PrismaCampaignStatus.DRAFT });
    expect(createMany).toHaveBeenCalledWith({
      data: [
        {
          campaignId: campaign.id,
          id: recipients[0]!.deliveryId,
          subscriberId: recipients[0]!.subscriberId,
        },
      ],
    });
  });

  it('não cria entregas quando outra requisição já iniciou a campanha', async () => {
    updateMany.mockResolvedValueOnce({ count: 0 });

    await expect(repository.startSending(sendingCampaign(), [])).resolves.toBe(false);
    expect(createMany).not.toHaveBeenCalled();
  });
});
