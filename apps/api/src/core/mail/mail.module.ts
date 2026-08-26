import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

import type { ApplicationConfig } from '@api/core/config/app.config';
import { RESEND_EMAIL_CLIENT, RESEND_WEBHOOK_CLIENT } from '@api/core/mail/mail.constants';
import { MailWebhookVerifier } from '@api/core/mail/services/mail-webhook-verifier.service';
import { MailService } from '@api/core/mail/services/mail.service';
import { ResendWebhookVerifierService } from '@api/core/mail/services/resend-webhook-verifier.service';
import { ResendService } from '@api/core/mail/services/resend.service';

@Module({
  exports: [MailService, MailWebhookVerifier],
  providers: [
    {
      inject: [ConfigService],
      provide: RESEND_EMAIL_CLIENT,
      useFactory: (configService: ConfigService<ApplicationConfig, true>) =>
        new Resend(configService.get('resend.apiKey', { infer: true })).emails,
    },
    {
      inject: [ConfigService],
      provide: RESEND_WEBHOOK_CLIENT,
      useFactory: (configService: ConfigService<ApplicationConfig, true>) =>
        new Resend(configService.get('resend.apiKey', { infer: true })).webhooks,
    },
    ResendService,
    ResendWebhookVerifierService,
    { provide: MailService, useExisting: ResendService },
    { provide: MailWebhookVerifier, useExisting: ResendWebhookVerifierService },
  ],
})
export class MailModule {}
