import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';

import { AppController } from '@api/app.controller';
import { AppModule } from '@api/app.module';
import { AppService } from '@api/app.service';
import { SupabaseAuthGuard } from '@api/core/auth/guards/supabase-auth.guard';
import { RolesGuard } from '@api/core/auth/guards/roles.guard';
import { SupabaseJwtService } from '@api/core/auth/services/supabase-jwt.service';
import type { ApplicationConfig } from '@api/core/config/app.config';
import { PrismaService } from '@api/core/database/prisma.service';
import { HealthController } from '@api/modules/health/controllers/health.controller';
import { HealthService } from '@api/modules/health/services/health.service';
import { ContactController } from '@api/modules/contact/controllers/contact.controller';
import { ContactService } from '@api/modules/contact/services/contact.service';
import { NewsletterController } from '@api/modules/newsletter/controllers/newsletter.controller';
import { AdminCampaignsController } from '@api/modules/newsletter/controllers/admin-campaigns.controller';
import { ResendWebhooksController } from '@api/modules/newsletter/controllers/resend-webhooks.controller';
import { CampaignsService } from '@api/modules/newsletter/services/campaigns.service';
import { NewsletterService } from '@api/modules/newsletter/services/newsletter.service';
import { NewsletterWebhooksService } from '@api/modules/newsletter/services/newsletter-webhooks.service';
import { AdminPostsController } from '@api/modules/posts/controllers/admin-posts.controller';
import { PostsController } from '@api/modules/posts/controllers/posts.controller';
import { TagsController } from '@api/modules/posts/controllers/tags.controller';
import { PostsService } from '@api/modules/posts/services/posts.service';
import { ProfilesController } from '@api/modules/profiles/controllers/profiles.controller';
import { ProfilesService } from '@api/modules/profiles/services/profiles.service';

describe('AppModule', () => {
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('carrega os módulos essenciais e a configuração validada', async () => {
    const configService = moduleRef.get(ConfigService<ApplicationConfig, true>);
    const pinoLogger = await moduleRef.resolve(PinoLogger);

    expect(moduleRef.get(AppController)).toBeInstanceOf(AppController);
    expect(moduleRef.get(AppService)).toBeInstanceOf(AppService);
    expect(moduleRef.get(PrismaService)).toBeDefined();
    expect(pinoLogger).toBeInstanceOf(PinoLogger);
    expect(moduleRef.get(SupabaseJwtService)).toBeInstanceOf(SupabaseJwtService);
    expect(moduleRef.get(SupabaseAuthGuard)).toBeInstanceOf(SupabaseAuthGuard);
    expect(moduleRef.get(RolesGuard)).toBeInstanceOf(RolesGuard);
    expect(moduleRef.get(HealthController)).toBeInstanceOf(HealthController);
    expect(moduleRef.get(HealthService)).toBeInstanceOf(HealthService);
    expect(moduleRef.get(ContactController)).toBeInstanceOf(ContactController);
    expect(moduleRef.get(ContactService)).toBeInstanceOf(ContactService);
    expect(moduleRef.get(NewsletterController)).toBeInstanceOf(NewsletterController);
    expect(moduleRef.get(NewsletterService)).toBeInstanceOf(NewsletterService);
    expect(moduleRef.get(AdminCampaignsController)).toBeInstanceOf(AdminCampaignsController);
    expect(moduleRef.get(CampaignsService)).toBeInstanceOf(CampaignsService);
    expect(moduleRef.get(ResendWebhooksController)).toBeInstanceOf(ResendWebhooksController);
    expect(moduleRef.get(NewsletterWebhooksService)).toBeInstanceOf(NewsletterWebhooksService);
    expect(moduleRef.get(ProfilesController)).toBeInstanceOf(ProfilesController);
    expect(moduleRef.get(ProfilesService)).toBeInstanceOf(ProfilesService);
    expect(moduleRef.get(PostsController)).toBeInstanceOf(PostsController);
    expect(moduleRef.get(TagsController)).toBeInstanceOf(TagsController);
    expect(moduleRef.get(AdminPostsController)).toBeInstanceOf(AdminPostsController);
    expect(moduleRef.get(PostsService)).toBeInstanceOf(PostsService);
    expect(configService.get('app.environment', { infer: true })).toBe('test');
    expect(configService.get('app.version', { infer: true })).toBe('1.2.3-test');
    expect(configService.get('database.connectOnStart', { infer: true })).toBe(false);
  });
});
