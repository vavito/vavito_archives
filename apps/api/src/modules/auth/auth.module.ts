import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { ApplicationConfig } from '@api/core/config/app.config';
import { SUPABASE_JWKS } from '@api/modules/auth/auth.constants';
import { AuthGuard } from '@api/modules/auth/auth.guard';
import { createSupabaseJwks } from '@api/modules/auth/supabase-jwks';
import { SupabaseJwtService } from '@api/modules/auth/supabase-jwt.service';

@Module({
  providers: [
    {
      provide: SUPABASE_JWKS,
      inject: [ConfigService],
      useFactory: (configService: ConfigService<ApplicationConfig, true>) =>
        createSupabaseJwks(configService),
    },
    SupabaseJwtService,
    AuthGuard,
  ],
  exports: [SupabaseJwtService, AuthGuard],
})
export class AuthModule {}

