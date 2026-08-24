import { Module } from '@nestjs/common';

import { MailService } from '@api/core/mail/services/mail.service';
import { PendingMailService } from '@api/core/mail/services/pending-mail.service';

@Module({
  exports: [MailService],
  providers: [{ provide: MailService, useClass: PendingMailService }],
})
export class MailModule {}
