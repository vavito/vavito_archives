import type { ApplicationConfig } from '@api/core/config/app.config';
import { MailDeliveryError } from '@api/core/mail/errors/mail-delivery.error';
import { MAIL_RETRY_BASE_DELAY_MS, RESEND_EMAIL_CLIENT } from '@api/core/mail/mail.constants';
import type { ResendEmailClient } from '@api/core/mail/providers/resend-email-client';
import {
  type MailDelivery,
  MailService,
  type NewCommentNotification,
  type NewsletterCampaignNotification,
  type NewsletterConfirmationNotification,
} from '@api/core/mail/services/mail.service';
import { newCommentEmailTemplate } from '@api/core/mail/templates/new-comment-email.template';
import { newsletterCampaignDeliveryTemplate } from '@api/core/mail/templates/newsletter-campaign-email.template';
import { newsletterConfirmationEmailTemplate } from '@api/core/mail/templates/newsletter-confirmation-email.template';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CreateEmailRequestOptions, ErrorResponse } from 'resend';

type ResendRequestOptions = CreateEmailRequestOptions & { signal: AbortSignal };

@Injectable()
export class ResendService implements MailService {
  private readonly logger = new Logger(ResendService.name);
  private readonly mailConfig: ApplicationConfig['resend'];
  private readonly frontendUrl: string;
  private readonly moderationUrl: string;

  constructor(
    @Inject(RESEND_EMAIL_CLIENT) private readonly resend: ResendEmailClient,
    configService: ConfigService<ApplicationConfig, true>,
  ) {
    this.mailConfig = configService.get('resend', { infer: true });
    this.frontendUrl = configService.get('app.frontendUrl', { infer: true });
    this.moderationUrl = new URL('/admin/comments', this.frontendUrl).toString();
  }

  async sendNewCommentNotification(notification: NewCommentNotification): Promise<MailDelivery> {
    const template = newCommentEmailTemplate(notification, this.moderationUrl);

    return this.sendWithRetry(
      {
        from: this.mailConfig.contactFrom,
        html: template.html,
        replyTo: this.mailConfig.replyTo,
        subject: template.subject,
        text: template.text,
        to: this.mailConfig.adminRecipient,
      },
      `new-comment/${notification.commentId}`,
    );
  }

  async sendNewsletterConfirmation(
    notification: NewsletterConfirmationNotification,
  ): Promise<MailDelivery> {
    const confirmationUrl = this.newsletterUrl(
      '/newsletter/confirm',
      notification.confirmationToken,
    );
    const unsubscribeUrl = this.newsletterUrl(
      '/newsletter/unsubscribe',
      notification.unsubscribeToken,
    );
    const template = newsletterConfirmationEmailTemplate(confirmationUrl, unsubscribeUrl);

    return this.sendWithRetry(
      {
        from: this.mailConfig.newsletterFrom,
        html: template.html,
        replyTo: this.mailConfig.replyTo,
        subject: template.subject,
        text: template.text,
        to: notification.recipient,
      },
      `newsletter-confirmation/${notification.subscriberId}/${notification.confirmationTokenHash}`,
    );
  }

  async sendNewsletterCampaign(
    notification: NewsletterCampaignNotification,
  ): Promise<MailDelivery> {
    const unsubscribeUrl = this.newsletterUrl(
      '/newsletter/unsubscribe',
      notification.unsubscribeToken,
    );
    const template = newsletterCampaignDeliveryTemplate(
      notification.htmlSnapshot,
      notification.previewText,
      notification.articleUrl,
      unsubscribeUrl,
    );

    return this.sendWithRetry(
      {
        from: this.mailConfig.newsletterFrom,
        html: template.html,
        replyTo: this.mailConfig.replyTo,
        subject: notification.subject,
        text: template.text,
        to: notification.recipient,
      },
      `newsletter-campaign/${notification.campaignId}/${notification.deliveryId}`,
    );
  }

  private async sendWithRetry(
    payload: Parameters<ResendEmailClient['send']>[0],
    idempotencyKey: string,
  ): Promise<MailDelivery> {
    let lastError: MailDeliveryError | undefined;

    for (let attempt = 1; attempt <= this.mailConfig.maxAttempts; attempt += 1) {
      try {
        const response = await this.sendOnce(payload, idempotencyKey);

        if (response.error) throw this.fromProviderError(response.error);
        if (!response.data?.id) {
          throw new MailDeliveryError({
            providerCode: 'invalid_response',
            retryable: false,
            statusCode: null,
          });
        }

        this.logger.log(`Email ${response.data.id} aceito pelo Resend.`);
        return { messageId: response.data.id, provider: 'resend' };
      } catch (error) {
        lastError =
          error instanceof MailDeliveryError
            ? error
            : new MailDeliveryError({
                cause: error,
                providerCode: 'request_failed',
                retryable: true,
                statusCode: null,
              });

        if (!lastError.retryable || attempt === this.mailConfig.maxAttempts) break;

        this.logger.warn(
          `Falha transitória no Resend; nova tentativa ${attempt + 1}/${this.mailConfig.maxAttempts}.`,
        );
        await this.delay(MAIL_RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
      }
    }

    const finalError =
      lastError ??
      new MailDeliveryError({
        providerCode: 'unknown',
        retryable: false,
        statusCode: null,
      });
    this.logger.error(
      `Falha definitiva no Resend (${finalError.providerCode}, status ${finalError.statusCode ?? 'indisponível'}).`,
    );
    throw finalError;
  }

  private async sendOnce(
    payload: Parameters<ResendEmailClient['send']>[0],
    idempotencyKey: string,
  ): ReturnType<ResendEmailClient['send']> {
    const controller = new AbortController();
    let timeout: NodeJS.Timeout | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeout = setTimeout(() => {
        controller.abort();
        reject(
          new MailDeliveryError({
            providerCode: 'request_timeout',
            retryable: true,
            statusCode: null,
          }),
        );
      }, this.mailConfig.timeoutMs);
    });
    const options = {
      idempotencyKey,
      signal: controller.signal,
    } as ResendRequestOptions;

    try {
      return await Promise.race([this.resend.send(payload, options), timeoutPromise]);
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }

  private fromProviderError(error: ErrorResponse): MailDeliveryError {
    const statusCode = error.statusCode ?? null;
    const retryable =
      statusCode === null ||
      statusCode === 408 ||
      statusCode === 429 ||
      (statusCode >= 500 && statusCode <= 599) ||
      (statusCode === 409 && error.name === 'concurrent_idempotent_requests');

    return new MailDeliveryError({
      providerCode: error.name,
      retryable,
      statusCode,
    });
  }

  private newsletterUrl(path: string, token: string): string {
    const url = new URL(path, this.frontendUrl);
    url.hash = new URLSearchParams({ token }).toString();
    return url.toString();
  }

  private delay(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }
}
