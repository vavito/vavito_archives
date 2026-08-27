import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from '@api/app.controller';
import { AppService } from '@api/app.service';
import { AuthModule } from '@api/core/auth/auth.module';
import configuration, { environmentFilePaths } from '@api/core/config/configuration';
import { validateEnvironment } from '@api/core/config/env.validation';
import { PrismaModule } from '@api/core/database/prisma.module';
import { HttpSecurityModule } from '@api/core/http/security/http-security.module';
import { CommentsModule } from '@api/modules/comments/comments.module';
import { ContactModule } from '@api/modules/contact/contact.module';
import { EngagementModule } from '@api/modules/engagement/engagement.module';
import { HealthModule } from '@api/modules/health/health.module';
import { MediaModule } from '@api/modules/media/media.module';
import { NewsletterModule } from '@api/modules/newsletter/newsletter.module';
import { PostsModule } from '@api/modules/posts/posts.module';
import { ProfilesModule } from '@api/modules/profiles/profiles.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      envFilePath: environmentFilePaths,
      isGlobal: true,
      load: [configuration],
      validate: validateEnvironment,
    }),
    PrismaModule,
    AuthModule,
    HttpSecurityModule,
    CommentsModule,
    ContactModule,
    EngagementModule,
    HealthModule,
    MediaModule,
    NewsletterModule,
    ProfilesModule,
    PostsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
