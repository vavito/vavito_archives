import type { ProfileAuthorizationRepository } from '@api/core/auth/repositories/profile-authorization.repository';
import type {
  MailService,
  NewsletterCampaignNotification,
} from '@api/core/mail/services/mail.service';
import { NEWSLETTER_UNSUBSCRIBE_PLACEHOLDER } from '@api/core/mail/templates/newsletter-campaign-email.template';
import { UserRole } from '@api/generated/prisma/client';
import { EmailCampaign } from '@api/modules/newsletter/domain/entities/email-campaign.entity';
import { CampaignStatus } from '@api/modules/newsletter/domain/enums/campaign-status.enum';
import { Subscriber } from '@api/modules/newsletter/domain/entities/subscriber.entity';
import { SubscriberConsentSource } from '@api/modules/newsletter/domain/enums/subscriber-consent-source.enum';
import { SubscriberConsent } from '@api/modules/newsletter/domain/value-objects/subscriber-consent.value-object';
import { SubscriberEmail } from '@api/modules/newsletter/domain/value-objects/subscriber-email.value-object';
import { SubscriberTokenHash } from '@api/modules/newsletter/domain/value-objects/subscriber-token-hash.value-object';
import type { CampaignsRepository } from '@api/modules/newsletter/repositories/campaigns.repository';
import type { SubscribersRepository } from '@api/modules/newsletter/repositories/subscribers.repository';
import { CampaignsService } from '@api/modules/newsletter/services/campaigns.service';
import type { SubscriberTokenService } from '@api/modules/newsletter/services/subscriber-token.service';
import type { PostsRepository } from '@api/modules/posts/repositories/posts.repository';
import { ConfigService } from '@nestjs/config';

const ACTOR_ID = '501b31f5-9918-4614-a38e-fb307406be88';
const CAMPAIGN_ID = '0b68ee40-f392-49cb-95c4-dd19cdd1bd43';
const POST_ID = 'bbd448e1-20bf-4fb3-aa26-f1ff9e7194f6';
const SUBSCRIBER_ID = '2813645a-8b74-4d1f-96c3-72cf3c594ad3';
const IDEMPOTENCY_KEY = 'e1903668-2b3e-4df8-b945-eddb4ef53f90';

function publishedPost() {
  return {
    excerpt: 'Resumo do artigo.',
    id: POST_ID,
    publishedAt: new Date('2026-08-24T12:00:00.000Z'),
    readingTimeMinutes: 5,
    slug: 'artigo-publicado',
    title: 'Artigo publicado',
  } as Awaited<ReturnType<PostsRepository['findPublishedReferenceById']>>;
}

function confirmedSubscriber(): Subscriber {
  const hash = SubscriberTokenHash.create('a'.repeat(64));
  const subscriber = Subscriber.subscribe({
    confirmationExpiresAt: new Date('2026-08-26T12:00:00.000Z'),
    confirmationTokenHash: hash,
    consent: SubscriberConsent.create({
      consentedAt: new Date('2026-08-24T10:00:00.000Z'),
      source: SubscriberConsentSource.HOME,
    }),
    email: SubscriberEmail.create('leitor@example.com'),
    id: SUBSCRIBER_ID,
    now: new Date('2026-08-24T10:00:00.000Z'),
    unsubscribeTokenHash: SubscriberTokenHash.create('b'.repeat(64)),
  });
  subscriber.confirm(hash, new Date('2026-08-24T11:00:00.000Z'));
  return subscriber;
}

describe('CampaignsService', () => {
  const create = jest.fn<Promise<void>, [EmailCampaign]>();
  const findById = jest.fn<Promise<EmailCampaign | null>, [string]>();
  const findByIdempotencyKey = jest.fn<Promise<EmailCampaign | null>, [string]>();
  const list = jest.fn<
    ReturnType<CampaignsRepository['list']>,
    Parameters<CampaignsRepository['list']>
  >();
  const markDeliveryFailed = jest.fn<Promise<void>, [string, string]>();
  const markDeliverySent = jest.fn<Promise<void>, [string, string]>();
  const save = jest.fn<Promise<void>, [EmailCampaign]>();
  const startSending = jest.fn<
    ReturnType<CampaignsRepository['startSending']>,
    Parameters<CampaignsRepository['startSending']>
  >();
  const campaignsRepository = {
    create,
    findById,
    findByIdempotencyKey,
    list,
    markDeliveryFailed,
    markDeliverySent,
    save,
    startSending,
  } as unknown as CampaignsRepository;
  const listEligibleForCampaign = jest.fn();
  const subscribersRepository = { listEligibleForCampaign } as unknown as SubscribersRepository;
  const findPublishedReferenceById = jest.fn();
  const postsRepository = {
    findPublishedReferenceById,
  } as unknown as PostsRepository;
  const findActiveRoleByProfileId = jest.fn();
  const authorizationRepository = {
    findActiveRoleByProfileId,
  } as unknown as ProfileAuthorizationRepository;
  const sendNewsletterCampaign = jest.fn<
    Promise<{ messageId: string; provider: 'resend' }>,
    [NewsletterCampaignNotification]
  >();
  const mailService = { sendNewsletterCampaign } as unknown as MailService;
  const unsubscribeFor = jest.fn(() => ({
    hash: SubscriberTokenHash.create('b'.repeat(64)),
    raw: 'unsubscribe-token',
  }));
  const tokenService = { unsubscribeFor } as unknown as SubscriberTokenService;
  const configService = new ConfigService({
    app: { frontendUrl: 'https://vavitoarchives.com.br' },
  });
  const service = new CampaignsService(
    campaignsRepository,
    subscribersRepository,
    postsRepository,
    authorizationRepository,
    mailService,
    tokenService,
    configService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    findActiveRoleByProfileId.mockResolvedValue(UserRole.ADMIN);
    findPublishedReferenceById.mockResolvedValue(publishedPost());
    create.mockResolvedValue(undefined);
    save.mockResolvedValue(undefined);
    startSending.mockResolvedValue(true);
    markDeliverySent.mockResolvedValue(undefined);
    markDeliveryFailed.mockResolvedValue(undefined);
    sendNewsletterCampaign.mockResolvedValue({ messageId: 'resend-id', provider: 'resend' });
    findByIdempotencyKey.mockResolvedValue(null);
  });

  it('cria DRAFT com snapshot do post e preview seguro', async () => {
    const response = await service.create(ACTOR_ID, {
      postId: POST_ID,
      previewText: 'Nova leitura',
      subject: 'Novo artigo',
    });
    const persisted = create.mock.calls[0]?.[0];
    if (!persisted) throw new Error('Campanha não persistida pelo teste.');

    expect(response.status).toBe(CampaignStatus.DRAFT);
    expect(persisted.postSnapshot.slug).toBe('artigo-publicado');
    expect(persisted.htmlSnapshot).toContain(NEWSLETTER_UNSUBSCRIBE_PLACEHOLDER);
    expect(persisted.htmlSnapshot).toContain('/artigos/artigo-publicado');
  });

  it('inicia atomicamente, envia para confirmados e conclui a campanha', async () => {
    await service.create(ACTOR_ID, { postId: POST_ID, subject: 'Novo artigo' });
    const campaign = create.mock.calls[0]?.[0];
    if (!campaign) throw new Error('Campanha não persistida pelo teste.');
    findById.mockResolvedValue(campaign);
    listEligibleForCampaign.mockResolvedValue([confirmedSubscriber()]);

    const response = await service.send(ACTOR_ID, campaign.id, IDEMPOTENCY_KEY);

    expect(startSending).toHaveBeenCalledWith(
      campaign,
      expect.arrayContaining([expect.objectContaining({ subscriberId: SUBSCRIBER_ID })]),
    );
    expect(sendNewsletterCampaign).toHaveBeenCalledWith(
      expect.objectContaining({
        campaignId: campaign.id,
        recipient: 'leitor@example.com',
        unsubscribeToken: 'unsubscribe-token',
      }),
    );
    expect(markDeliverySent).toHaveBeenCalledWith(expect.any(String), 'resend-id');
    expect(response.status).toBe(CampaignStatus.SENT);
  });

  it('retorna a campanha sem reenviar quando a mesma chave já foi aceita', async () => {
    const campaign = EmailCampaign.create({
      createdById: ACTOR_ID,
      htmlSnapshot: `<html>${NEWSLETTER_UNSUBSCRIBE_PLACEHOLDER}</html>`,
      id: CAMPAIGN_ID,
      now: new Date('2026-08-25T10:00:00.000Z'),
      postId: POST_ID,
      postSnapshot: {
        excerpt: 'Resumo',
        id: POST_ID,
        publishedAt: '2026-08-24T12:00:00.000Z',
        readingTimeMinutes: 5,
        slug: 'artigo-publicado',
        title: 'Artigo',
      },
      previewText: 'Preview',
      subject: 'Assunto',
    });
    campaign.startSending({
      audienceCount: 1,
      idempotencyKey: IDEMPOTENCY_KEY,
      now: new Date('2026-08-25T10:01:00.000Z'),
    });
    campaign.markSent('resend-id', new Date('2026-08-25T10:02:00.000Z'));
    findById.mockResolvedValue(campaign);
    findByIdempotencyKey.mockResolvedValue(campaign);

    await expect(service.send(ACTOR_ID, campaign.id, IDEMPOTENCY_KEY)).resolves.toMatchObject({
      status: CampaignStatus.SENT,
    });
    expect(sendNewsletterCampaign).not.toHaveBeenCalled();
  });

  it('rejeita header inválido e chave pertencente a outra campanha', async () => {
    const campaign = EmailCampaign.create({
      createdById: ACTOR_ID,
      htmlSnapshot: `<html>${NEWSLETTER_UNSUBSCRIBE_PLACEHOLDER}</html>`,
      id: CAMPAIGN_ID,
      now: new Date('2026-08-25T10:00:00.000Z'),
      postId: POST_ID,
      postSnapshot: {
        excerpt: 'Resumo',
        id: POST_ID,
        publishedAt: '2026-08-24T12:00:00.000Z',
        readingTimeMinutes: 5,
        slug: 'artigo-publicado',
        title: 'Artigo',
      },
      previewText: 'Preview',
      subject: 'Assunto',
    });
    findById.mockResolvedValue(campaign);

    await expect(service.send(ACTOR_ID, campaign.id, undefined)).rejects.toMatchObject({
      code: 'CAMPAIGN_IDEMPOTENCY_KEY_INVALID',
    });

    const keyOwner = EmailCampaign.create({
      createdById: ACTOR_ID,
      htmlSnapshot: `<html>${NEWSLETTER_UNSUBSCRIBE_PLACEHOLDER}</html>`,
      id: 'ada3792e-54da-4243-9921-28175e1a15f5',
      now: new Date('2026-08-25T10:00:00.000Z'),
      postId: POST_ID,
      postSnapshot: campaign.postSnapshot,
      previewText: 'Preview',
      subject: 'Assunto',
    });
    findByIdempotencyKey.mockResolvedValueOnce(keyOwner);

    await expect(service.send(ACTOR_ID, campaign.id, IDEMPOTENCY_KEY)).rejects.toMatchObject({
      code: 'CAMPAIGN_IDEMPOTENCY_KEY_CONFLICT',
    });
    expect(startSending).not.toHaveBeenCalled();
  });

  it('rejeita envio sem assinantes confirmados', async () => {
    await service.create(ACTOR_ID, { postId: POST_ID, subject: 'Novo artigo' });
    const campaign = create.mock.calls[0]?.[0];
    if (!campaign) throw new Error('Campanha não persistida pelo teste.');
    findById.mockResolvedValue(campaign);
    listEligibleForCampaign.mockResolvedValue([]);

    await expect(service.send(ACTOR_ID, campaign.id, IDEMPOTENCY_KEY)).rejects.toMatchObject({
      code: 'CAMPAIGN_AUDIENCE_EMPTY',
    });
    expect(startSending).not.toHaveBeenCalled();
  });

  it('marca campanha e entrega como FAILED quando o Resend rejeita', async () => {
    await service.create(ACTOR_ID, { postId: POST_ID, subject: 'Novo artigo' });
    const campaign = create.mock.calls[0]?.[0];
    if (!campaign) throw new Error('Campanha não persistida pelo teste.');
    findById.mockResolvedValue(campaign);
    listEligibleForCampaign.mockResolvedValue([confirmedSubscriber()]);
    sendNewsletterCampaign.mockRejectedValueOnce(new Error('indisponível'));

    await expect(service.send(ACTOR_ID, campaign.id, IDEMPOTENCY_KEY)).rejects.toMatchObject({
      code: 'CAMPAIGN_PROVIDER_REJECTED',
    });
    expect(campaign.status).toBe(CampaignStatus.FAILED);
    expect(markDeliveryFailed).toHaveBeenCalledWith(expect.any(String), 'provider_rejected');
    expect(save).toHaveBeenCalledWith(campaign);
  });
});
