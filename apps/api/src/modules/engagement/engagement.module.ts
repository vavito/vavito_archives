import { Module } from '@nestjs/common';

import { AuthModule } from '@api/core/auth/auth.module';
import { EngagementController } from '@api/modules/engagement/controllers/engagement.controller';
import { BookmarksRepository } from '@api/modules/engagement/repositories/bookmarks.repository';
import { PrismaBookmarksRepository } from '@api/modules/engagement/repositories/prisma-bookmarks.repository';
import { PrismaReactionsRepository } from '@api/modules/engagement/repositories/prisma-reactions.repository';
import { ReactionsRepository } from '@api/modules/engagement/repositories/reactions.repository';
import { BookmarksService } from '@api/modules/engagement/services/bookmarks.service';
import { ReactionsService } from '@api/modules/engagement/services/reactions.service';

@Module({
  controllers: [EngagementController],
  exports: [BookmarksRepository, BookmarksService, ReactionsRepository, ReactionsService],
  imports: [AuthModule],
  providers: [
    BookmarksService,
    ReactionsService,
    { provide: BookmarksRepository, useClass: PrismaBookmarksRepository },
    { provide: ReactionsRepository, useClass: PrismaReactionsRepository },
  ],
})
export class EngagementModule {}
