import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

import type { ApplicationConfig } from '@api/core/config/app.config';
import { RESEND_EMAIL_CLIENT } from '@api/core/mail/mail.constants';
import { MailService } from '@api/core/mail/services/mail.service';
import { ResendService } from '@api/core/mail/services/resend.service';

@Module({
  exports: [MailService],
  providers: [
    {
      inject: [ConfigService],
      provide: RESEND_EMAIL_CLIENT,
      useFactory: (configService: ConfigService<ApplicationConfig, true>) =>
        new Resend(configService.get('resend.apiKey', { infer: true })).emails,
    },
    ResendService,
    { provide: MailService, useExisting: ResendService },
  ],
})
export class MailModule {}
