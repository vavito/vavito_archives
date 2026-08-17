import { Module } from '@nestjs/common';

import { PrismaPostsRepository } from '@api/modules/posts/repositories/prisma-posts.repository';
import { PostsRepository } from '@api/modules/posts/repositories/posts.repository';

@Module({
  exports: [PostsRepository],
  providers: [{ provide: PostsRepository, useClass: PrismaPostsRepository }],
})
export class PostsModule {}
