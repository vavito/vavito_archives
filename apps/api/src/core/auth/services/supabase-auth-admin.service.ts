import { Inject, Injectable } from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';

import { AuthAdminService } from '@api/core/auth/services/auth-admin.service';
import { SUPABASE_ADMIN_CLIENT } from '@api/core/supabase/supabase.constants';

@Injectable()
export class SupabaseAuthAdminService implements AuthAdminService {
  constructor(
    @Inject(SUPABASE_ADMIN_CLIENT) private readonly supabaseAdminClient: SupabaseClient,
  ) {}

  async deleteUser(userId: string): Promise<void> {
    const { error } = await this.supabaseAdminClient.auth.admin.deleteUser(userId);

    if (error && error.status !== 404) {
      throw error;
    }
  }
}
