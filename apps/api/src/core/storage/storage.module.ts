import { Module } from '@nestjs/common';

import { AvatarStorageService } from '@api/core/storage/avatar-storage.service';
import { SupabaseAvatarStorageService } from '@api/core/storage/supabase-avatar-storage.service';
import { SupabaseModule } from '@api/core/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  providers: [
    {
      provide: AvatarStorageService,
      useClass: SupabaseAvatarStorageService,
    },
  ],
  exports: [AvatarStorageService],
})
export class StorageModule {}
