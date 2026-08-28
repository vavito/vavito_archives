import { Module } from '@nestjs/common';

import { AuthModule } from '@api/core/auth/auth.module';
import { AdminPostsController } from '@api/modules/posts/controllers/admin-posts.controller';
import { PostsController } from '@api/modules/posts/controllers/posts.controller';
import { TagsController } from '@api/modules/posts/controllers/tags.controller';
import { PrismaPostsRepository } from '@api/modules/posts/repositories/prisma-posts.repository';
import { PostsRepository } from '@api/modules/posts/repositories/posts.repository';
import { PostViewFingerprintService } from '@api/modules/posts/services/post-view-fingerprint.service';
import { PostsService } from '@api/modules/posts/services/posts.service';

@Module({
  controllers: [PostsController, TagsController, AdminPostsController],
  exports: [PostsRepository, PostsService],
  imports: [AuthModule],
  providers: [
    PostsService,
    PostViewFingerprintService,
    { provide: PostsRepository, useClass: PrismaPostsRepository },
  ],
})
export class PostsModule {}
