import { MailModule } from '@api/core/mail/mail.module';
import { AuthModule } from '@api/core/auth/auth.module';
import { AdminCampaignsController } from '@api/modules/newsletter/controllers/admin-campaigns.controller';
import { NewsletterController } from '@api/modules/newsletter/controllers/newsletter.controller';
import { NewsletterRateLimitGuard } from '@api/modules/newsletter/guards/newsletter-rate-limit.guard';
import { PrismaSubscribersRepository } from '@api/modules/newsletter/repositories/prisma-subscribers.repository';
import { SubscribersRepository } from '@api/modules/newsletter/repositories/subscribers.repository';
import { NewsletterService } from '@api/modules/newsletter/services/newsletter.service';
import { SubscriberTokenService } from '@api/modules/newsletter/services/subscriber-token.service';
import { CampaignsRepository } from '@api/modules/newsletter/repositories/campaigns.repository';
import { PrismaCampaignsRepository } from '@api/modules/newsletter/repositories/prisma-campaigns.repository';
import { CampaignsService } from '@api/modules/newsletter/services/campaigns.service';
import { PostsModule } from '@api/modules/posts/posts.module';
import { Module } from '@nestjs/common';

@Module({
  controllers: [NewsletterController, AdminCampaignsController],
  imports: [AuthModule, MailModule, PostsModule],
  providers: [
    CampaignsService,
    NewsletterService,
    NewsletterRateLimitGuard,
    SubscriberTokenService,
    { provide: CampaignsRepository, useClass: PrismaCampaignsRepository },
    { provide: SubscribersRepository, useClass: PrismaSubscribersRepository },
  ],
})
export class NewsletterModule {}
