import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { ApplicationConfig } from '@api/core/config/app.config';
import {
  AvatarStorageService,
  type AvatarUpload,
} from '@api/core/storage/services/avatar-storage.service';
import { StorageService } from '@api/core/storage/services/storage.service';

@Injectable()
export class SupabaseAvatarStorageService implements AvatarStorageService {
  private readonly bucket: string;

  constructor(
    private readonly storage: StorageService,
    configService: ConfigService<ApplicationConfig, true>,
  ) {
    this.bucket = configService.get('supabase.avatarsBucket', { infer: true });
  }

  publicUrl(path: string): string {
    return this.storage.publicUrl(this.bucket, path);
  }

  async remove(path: string): Promise<void> {
    await this.storage.remove(this.bucket, path);
  }

  async upload(profileId: string, file: AvatarUpload): Promise<string> {
    const path = `${profileId}/${randomUUID()}.${file.extension}`;
    await this.storage.upload({
      bucket: this.bucket,
      buffer: file.buffer,
      contentType: file.contentType,
      path,
    });

    return path;
  }
}
