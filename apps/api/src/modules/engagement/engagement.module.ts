import { Module } from '@nestjs/common';

import { AuthModule } from '@api/core/auth/auth.module';
import { PrismaReactionsRepository } from '@api/modules/engagement/repositories/prisma-reactions.repository';
import { ReactionsRepository } from '@api/modules/engagement/repositories/reactions.repository';
import { ReactionsService } from '@api/modules/engagement/services/reactions.service';

@Module({
  exports: [ReactionsRepository, ReactionsService],
  imports: [AuthModule],
  providers: [
    ReactionsService,
    { provide: ReactionsRepository, useClass: PrismaReactionsRepository },
  ],
})
export class EngagementModule {}
