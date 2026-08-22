import { Inject, Injectable, Logger } from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';

import { StorageOperationError } from '@api/core/storage/errors/storage-operation.error';
import { StorageService, type StorageUpload } from '@api/core/storage/services/storage.service';
import { SUPABASE_ADMIN_CLIENT } from '@api/core/supabase/supabase.constants';

@Injectable()
export class SupabaseStorageService implements StorageService {
  private readonly logger = new Logger(SupabaseStorageService.name);

  constructor(
    @Inject(SUPABASE_ADMIN_CLIENT) private readonly supabaseAdminClient: SupabaseClient,
  ) {}

  publicUrl(bucket: string, path: string): string {
    return this.supabaseAdminClient.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }

  async remove(bucket: string, path: string): Promise<void> {
    const { error } = await this.supabaseAdminClient.storage.from(bucket).remove([path]);

    if (error) {
      this.logger.error(`Falha ao remover objeto do bucket ${bucket} no path ${path}.`);
      throw new StorageOperationError('remove', { cause: error });
    }
  }

  async upload(file: StorageUpload): Promise<void> {
    const { error } = await this.supabaseAdminClient.storage
      .from(file.bucket)
      .upload(file.path, file.buffer, {
        contentType: file.contentType,
        upsert: false,
      });

    if (error) {
      this.logger.error(`Falha ao enviar objeto ao bucket ${file.bucket} no path ${file.path}.`);
      throw new StorageOperationError('upload', { cause: error });
    }
  }
}
