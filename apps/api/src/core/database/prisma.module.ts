import { Global, Module } from '@nestjs/common';

import { PrismaService } from '@api/core/database/prisma.service';

@Global()
@Module({
  exports: [PrismaService],
  providers: [PrismaService],
})
export class PrismaModule {}
