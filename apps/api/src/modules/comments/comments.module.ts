import { Module } from '@nestjs/common';

import { AuthModule } from '@api/core/auth/auth.module';
import { MailModule } from '@api/core/mail/mail.module';
import { StorageModule } from '@api/core/storage/storage.module';
import { AdminCommentsController } from '@api/modules/comments/controllers/admin-comments.controller';
import { CommentsController } from '@api/modules/comments/controllers/comments.controller';
import { CommentsRateLimitGuard } from '@api/modules/comments/guards/comments-rate-limit.guard';
import { CommentsRepository } from '@api/modules/comments/repositories/comments.repository';
import { PrismaCommentsRepository } from '@api/modules/comments/repositories/prisma-comments.repository';
import { CommentsService } from '@api/modules/comments/services/comments.service';
import { PostsModule } from '@api/modules/posts/posts.module';

@Module({
  controllers: [CommentsController, AdminCommentsController],
  exports: [CommentsRepository, CommentsService],
  imports: [AuthModule, MailModule, PostsModule, StorageModule],
  providers: [
    CommentsService,
    CommentsRateLimitGuard,
    { provide: CommentsRepository, useClass: PrismaCommentsRepository },
  ],
})
export class CommentsModule {}
