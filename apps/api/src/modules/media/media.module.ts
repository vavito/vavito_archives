import { Module } from '@nestjs/common';

import { StorageModule } from '@api/core/storage/storage.module';
import { PrismaMediaRepository } from '@api/modules/media/repositories/prisma-media.repository';
import { MediaRepository } from '@api/modules/media/repositories/media.repository';
import { MediaService } from '@api/modules/media/services/media.service';

@Module({
  exports: [MediaRepository, MediaService],
  imports: [StorageModule],
  providers: [
    MediaService,
    {
      provide: MediaRepository,
      useClass: PrismaMediaRepository,
    },
  ],
})
export class MediaModule {}
