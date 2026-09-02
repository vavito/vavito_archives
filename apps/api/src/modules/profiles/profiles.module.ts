import { Module } from '@nestjs/common';

import { AuthModule } from '@api/core/auth/auth.module';
import { MailModule } from '@api/core/mail/mail.module';
import { StorageModule } from '@api/core/storage/storage.module';
import { AvatarFilePipe } from '@api/modules/profiles/pipes/avatar-file.pipe';
import { PrismaProfilesRepository } from '@api/modules/profiles/repositories/prisma-profiles.repository';
import { ProfilesRepository } from '@api/modules/profiles/repositories/profiles.repository';
import { ProfilesController } from '@api/modules/profiles/controllers/profiles.controller';
import { ProfilesService } from '@api/modules/profiles/services/profiles.service';

@Module({
  imports: [AuthModule, MailModule, StorageModule],
  controllers: [ProfilesController],
  providers: [
    AvatarFilePipe,
    ProfilesService,
    {
      provide: ProfilesRepository,
      useClass: PrismaProfilesRepository,
    },
  ],
})
export class ProfilesModule {}
