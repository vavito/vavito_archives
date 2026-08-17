import { Module } from '@nestjs/common';

import { AuthModule } from '@api/core/auth/auth.module';
import { PrismaPostsRepository } from '@api/modules/posts/repositories/prisma-posts.repository';
import { PostsRepository } from '@api/modules/posts/repositories/posts.repository';
import { PostsService } from '@api/modules/posts/services/posts.service';

@Module({
  exports: [PostsRepository, PostsService],
  imports: [AuthModule],
  providers: [PostsService, { provide: PostsRepository, useClass: PrismaPostsRepository }],
})
export class PostsModule {}
