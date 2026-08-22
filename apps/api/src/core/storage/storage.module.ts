import { Module } from '@nestjs/common';

import { AvatarStorageService } from '@api/core/storage/services/avatar-storage.service';
import { StorageService } from '@api/core/storage/services/storage.service';
import { SupabaseAvatarStorageService } from '@api/core/storage/services/supabase-avatar-storage.service';
import { SupabaseStorageService } from '@api/core/storage/services/supabase-storage.service';
import { SupabaseModule } from '@api/core/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  providers: [
    {
      provide: StorageService,
      useClass: SupabaseStorageService,
    },
    {
      provide: AvatarStorageService,
      useClass: SupabaseAvatarStorageService,
    },
  ],
  exports: [AvatarStorageService, StorageService],
})
export class StorageModule {}
