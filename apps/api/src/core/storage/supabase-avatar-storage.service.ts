import { randomUUID } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SupabaseClient } from '@supabase/supabase-js';

import type { ApplicationConfig } from '@api/core/config/app.config';
import { AvatarStorageService, type AvatarUpload } from '@api/core/storage/avatar-storage.service';
import { SUPABASE_ADMIN_CLIENT } from '@api/core/supabase/supabase.constants';

@Injectable()
export class SupabaseAvatarStorageService implements AvatarStorageService {
  private readonly bucket: string;

  constructor(
    @Inject(SUPABASE_ADMIN_CLIENT) private readonly supabaseAdminClient: SupabaseClient,
    configService: ConfigService<ApplicationConfig, true>,
  ) {
    this.bucket = configService.get('supabase.avatarsBucket', { infer: true });
  }

  publicUrl(path: string): string {
    return this.supabaseAdminClient.storage.from(this.bucket).getPublicUrl(path).data.publicUrl;
  }

  async remove(path: string): Promise<void> {
    const { error } = await this.supabaseAdminClient.storage.from(this.bucket).remove([path]);

    if (error) {
      throw error;
    }
  }

  async upload(profileId: string, file: AvatarUpload): Promise<string> {
    const path = `${profileId}/${randomUUID()}.${file.extension}`;
    const { error } = await this.supabaseAdminClient.storage
      .from(this.bucket)
      .upload(path, file.buffer, {
        contentType: file.contentType,
        upsert: false,
      });

    if (error) {
      throw error;
    }

    return path;
  }
}
