import { MailModule } from '@api/core/mail/mail.module';
import { NewsletterController } from '@api/modules/newsletter/controllers/newsletter.controller';
import { NewsletterRateLimitGuard } from '@api/modules/newsletter/guards/newsletter-rate-limit.guard';
import { PrismaSubscribersRepository } from '@api/modules/newsletter/repositories/prisma-subscribers.repository';
import { SubscribersRepository } from '@api/modules/newsletter/repositories/subscribers.repository';
import { NewsletterService } from '@api/modules/newsletter/services/newsletter.service';
import { SubscriberTokenService } from '@api/modules/newsletter/services/subscriber-token.service';
import { Module } from '@nestjs/common';

@Module({
  controllers: [NewsletterController],
  imports: [MailModule],
  providers: [
    NewsletterService,
    NewsletterRateLimitGuard,
    SubscriberTokenService,
    { provide: SubscribersRepository, useClass: PrismaSubscribersRepository },
  ],
})
export class NewsletterModule {}
