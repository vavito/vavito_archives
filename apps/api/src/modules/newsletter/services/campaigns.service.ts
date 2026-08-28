import { randomUUID } from 'node:crypto';

import type { ApplicationConfig } from '@api/core/config/app.config';
import { ForbiddenAccessException } from '@api/core/auth/errors/forbidden-access.exception';
import { ProfileAuthorizationRepository } from '@api/core/auth/repositories/profile-authorization.repository';
import { MailService } from '@api/core/mail/services/mail.service';
import {
  NEWSLETTER_UNSUBSCRIBE_PLACEHOLDER,
  newsletterCampaignSnapshot,
} from '@api/core/mail/templates/newsletter-campaign-email.template';
import { UserRole } from '@api/generated/prisma/client';
import { EmailCampaign } from '@api/modules/newsletter/domain/entities/email-campaign.entity';
import { CampaignStatus } from '@api/modules/newsletter/domain/enums/campaign-status.enum';
import { CampaignContentInvalidError } from '@api/modules/newsletter/domain/errors/campaign-content-invalid.error';
import { CampaignPostNotPublishedError } from '@api/modules/newsletter/domain/errors/campaign-post-not-published.error';
import type { ListCampaignsQueryDto } from '@api/modules/newsletter/dto/query/list-campaigns-query.dto';
import type { CreateCampaignDto } from '@api/modules/newsletter/dto/request/create-campaign.dto';
import type { UpdateCampaignDto } from '@api/modules/newsletter/dto/request/update-campaign.dto';
import type {
  EmailCampaignAdminDto,
  PaginatedEmailCampaignsDto,
} from '@api/modules/newsletter/dto/response/email-campaign-response.dto';
import { throwCampaignDomainException } from '@api/modules/newsletter/errors/campaign-domain.exception';
import { CampaignIdempotencyConflictException } from '@api/modules/newsletter/errors/campaign-idempotency-conflict.exception';
import { CampaignIdempotencyKeyInvalidException } from '@api/modules/newsletter/errors/campaign-idempotency-key-invalid.exception';
import { CampaignNotFoundException } from '@api/modules/newsletter/errors/campaign-not-found.exception';
import { CampaignProviderRejectedException } from '@api/modules/newsletter/errors/campaign-provider-rejected.exception';
import { throwSubscriberDomainException } from '@api/modules/newsletter/errors/subscriber-domain.exception';
import { EmailCampaignResponseMapper } from '@api/modules/newsletter/mappers/email-campaign-response.mapper';
import {
  type CampaignDeliveryRecipient,
  CampaignsRepository,
} from '@api/modules/newsletter/repositories/campaigns.repository';
import { SubscribersRepository } from '@api/modules/newsletter/repositories/subscribers.repository';
import { SubscriberTokenService } from '@api/modules/newsletter/services/subscriber-token.service';
import { PostsRepository } from '@api/modules/posts/repositories/posts.repository';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isUUID } from 'class-validator';

interface CampaignRecipient extends CampaignDeliveryRecipient {
  articleUrl: string;
  email: string;
  unsubscribeToken: string;
}

function paginationMeta(page: number, limit: number, total: number) {
  return { limit, page, total, totalPages: Math.ceil(total / limit) };
}

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
}

@Injectable()
export class CampaignsService {
  private readonly frontendUrl: string;

  constructor(
    private readonly campaignsRepository: CampaignsRepository,
    private readonly subscribersRepository: SubscribersRepository,
    private readonly postsRepository: PostsRepository,
    private readonly authorizationRepository: ProfileAuthorizationRepository,
    private readonly mailService: MailService,
    private readonly subscriberTokenService: SubscriberTokenService,
    configService: ConfigService<ApplicationConfig, true>,
  ) {
    this.frontendUrl = configService.get('app.frontendUrl', { infer: true });
  }

  async create(actorId: string, dto: CreateCampaignDto): Promise<EmailCampaignAdminDto> {
    await this.ensureAdminActor(actorId);
    const post = await this.requirePublishedPost(dto.postId);

    const previewText = dto.previewText?.trim() || `Leia o novo artigo: ${post.title}`;
    const articleUrl = this.articleUrl(post.slug);
    const campaign = this.executeDomainAction(() =>
      EmailCampaign.create({
        createdById: actorId,
        htmlSnapshot: newsletterCampaignSnapshot({
          articleUrl,
          excerpt: post.excerpt,
          previewText,
          title: post.title,
        }),
        id: randomUUID(),
        now: new Date(),
        postId: post.id,
        postSnapshot: {
          excerpt: post.excerpt,
          id: post.id,
          publishedAt: post.publishedAt.toISOString(),
          readingTimeMinutes: post.readingTimeMinutes,
          slug: post.slug,
          title: post.title,
        },
        previewText,
        subject: dto.subject,
      }),
    );

    await this.campaignsRepository.create(campaign);
    return EmailCampaignResponseMapper.toAdmin(campaign);
  }

  async get(actorId: string, id: string): Promise<EmailCampaignAdminDto> {
    await this.ensureAdminActor(actorId);
    return EmailCampaignResponseMapper.toAdmin(await this.requireCampaign(id));
  }

  async list(actorId: string, query: ListCampaignsQueryDto): Promise<PaginatedEmailCampaignsDto> {
    await this.ensureAdminActor(actorId);
    const result = await this.campaignsRepository.list(query);
    return {
      items: result.items.map((campaign) => EmailCampaignResponseMapper.toAdmin(campaign)),
      meta: paginationMeta(query.page, query.limit, result.total),
    };
  }

  async update(
    actorId: string,
    id: string,
    dto: UpdateCampaignDto,
  ): Promise<EmailCampaignAdminDto> {
    await this.ensureAdminActor(actorId);
    const campaign = await this.requireCampaign(id);

    if (dto.html !== undefined && !dto.html.includes(NEWSLETTER_UNSUBSCRIBE_PLACEHOLDER)) {
      throwCampaignDomainException(new CampaignContentInvalidError());
    }

    this.executeDomainAction(() =>
      campaign.updateContent({
        now: new Date(),
        ...(dto.html !== undefined ? { htmlSnapshot: dto.html } : {}),
        ...(dto.previewText !== undefined ? { previewText: dto.previewText } : {}),
        ...(dto.subject !== undefined ? { subject: dto.subject } : {}),
      }),
    );
    await this.campaignsRepository.save(campaign);
    return EmailCampaignResponseMapper.toAdmin(campaign);
  }

  async send(
    actorId: string,
    id: string,
    idempotencyKey: string | undefined,
  ): Promise<EmailCampaignAdminDto> {
    await this.ensureAdminActor(actorId);
    if (!idempotencyKey || !isUUID(idempotencyKey)) {
      throw new CampaignIdempotencyKeyInvalidException();
    }
    const campaign = await this.requireCampaign(id);
    const keyOwner = await this.campaignsRepository.findByIdempotencyKey(idempotencyKey);

    if (keyOwner && keyOwner.id !== campaign.id) {
      throw new CampaignIdempotencyConflictException();
    }
    if (
      campaign.idempotencyKey === idempotencyKey &&
      (campaign.status === CampaignStatus.SENDING || campaign.status === CampaignStatus.SENT)
    ) {
      return EmailCampaignResponseMapper.toAdmin(campaign);
    }

    await this.requirePublishedPost(campaign.postId);
    const subscribers = await this.subscribersRepository.listEligibleForCampaign();
    const articleUrl = this.articleUrl(campaign.postSnapshot.slug);
    const recipients: CampaignRecipient[] = subscribers.map((subscriber) => {
      this.executeSubscriberAction(() => subscriber.ensureEligibleForCampaign());
      return {
        articleUrl,
        deliveryId: randomUUID(),
        email: subscriber.email.value,
        subscriberId: subscriber.id,
        unsubscribeToken: this.subscriberTokenService.unsubscribeFor(subscriber.id).raw,
      };
    });

    this.executeDomainAction(() =>
      campaign.startSending({
        audienceCount: recipients.length,
        idempotencyKey,
        now: new Date(),
      }),
    );

    let started: boolean;
    try {
      started = await this.campaignsRepository.startSending(campaign, recipients);
    } catch (error) {
      if (isUniqueConstraintError(error)) throw new CampaignIdempotencyConflictException();
      throw error;
    }

    if (!started) {
      const current = await this.requireCampaign(id);
      if (current.idempotencyKey === idempotencyKey) {
        return EmailCampaignResponseMapper.toAdmin(current);
      }
      return this.executeDomainAction(() => {
        current.startSending({ audienceCount: recipients.length, idempotencyKey, now: new Date() });
        return EmailCampaignResponseMapper.toAdmin(current);
      });
    }

    let firstProviderId: string | null = null;
    for (const recipient of recipients) {
      try {
        const delivery = await this.mailService.sendNewsletterCampaign({
          articleUrl: recipient.articleUrl,
          campaignId: campaign.id,
          deliveryId: recipient.deliveryId,
          htmlSnapshot: campaign.htmlSnapshot,
          previewText: campaign.previewText,
          recipient: recipient.email,
          subject: campaign.subject,
          unsubscribeToken: recipient.unsubscribeToken,
        });
        firstProviderId ??= delivery.messageId;
        await this.campaignsRepository.markDeliverySent(recipient.deliveryId, delivery.messageId);
      } catch {
        await this.campaignsRepository.markDeliveryFailed(
          recipient.deliveryId,
          'provider_rejected',
        );
        this.executeDomainAction(() => campaign.markFailed('provider_rejected', new Date()));
        await this.campaignsRepository.save(campaign);
        throw new CampaignProviderRejectedException();
      }
    }

    if (!firstProviderId) {
      throwCampaignDomainException(new CampaignContentInvalidError());
    }
    this.executeDomainAction(() => campaign.markSent(firstProviderId, new Date()));
    await this.campaignsRepository.save(campaign);
    return EmailCampaignResponseMapper.toAdmin(campaign);
  }

  private articleUrl(slug: string): string {
    return new URL(`/artigos/${encodeURIComponent(slug)}`, this.frontendUrl).toString();
  }

  private async ensureAdminActor(actorId: string): Promise<void> {
    const role = await this.authorizationRepository.findActiveRoleByProfileId(actorId);
    if (role !== UserRole.ADMIN) throw new ForbiddenAccessException();
  }

  private executeDomainAction<T>(action: () => T): T {
    try {
      return action();
    } catch (error) {
      throwCampaignDomainException(error);
    }
  }

  private executeSubscriberAction<T>(action: () => T): T {
    try {
      return action();
    } catch (error) {
      throwSubscriberDomainException(error);
    }
  }

  private async requireCampaign(id: string): Promise<EmailCampaign> {
    const campaign = await this.campaignsRepository.findById(id);
    if (!campaign) throw new CampaignNotFoundException();
    return campaign;
  }

  private async requirePublishedPost(id: string) {
    const post = await this.postsRepository.findPublishedReferenceById(id);
    if (!post) {
      throwCampaignDomainException(new CampaignPostNotPublishedError());
    }
    return post;
  }
}
