import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';

import type { ApplicationConfig } from '@api/core/config/app.config';
import { SUPABASE_ADMIN_CLIENT } from '@api/core/supabase/supabase.constants';

@Global()
@Module({
  providers: [
    {
      inject: [ConfigService],
      provide: SUPABASE_ADMIN_CLIENT,
      useFactory: (configService: ConfigService<ApplicationConfig, true>) =>
        createClient(
          configService.get('supabase.url', { infer: true }),
          configService.get('supabase.serviceRoleKey', { infer: true }),
          {
            auth: {
              autoRefreshToken: false,
              detectSessionInUrl: false,
              persistSession: false,
            },
          },
        ),
    },
  ],
  exports: [SUPABASE_ADMIN_CLIENT],
})
export class SupabaseModule {}
