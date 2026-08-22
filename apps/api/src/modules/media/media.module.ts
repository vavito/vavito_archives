import { Module } from '@nestjs/common';

import { StorageModule } from '@api/core/storage/storage.module';
import { AdminMediaController } from '@api/modules/media/controllers/admin-media.controller';
import { MediaFilePipe } from '@api/modules/media/pipes/media-file.pipe';
import { PrismaMediaRepository } from '@api/modules/media/repositories/prisma-media.repository';
import { MediaRepository } from '@api/modules/media/repositories/media.repository';
import { MediaService } from '@api/modules/media/services/media.service';

@Module({
  controllers: [AdminMediaController],
  exports: [MediaRepository, MediaService],
  imports: [StorageModule],
  providers: [
    MediaFilePipe,
    MediaService,
    {
      provide: MediaRepository,
      useClass: PrismaMediaRepository,
    },
  ],
})
export class MediaModule {}
