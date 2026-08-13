import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import { SUPABASE_JWKS } from '@api/core/auth/auth.constants';
import { SupabaseAuthGuard } from '@api/core/auth/guards/supabase-auth.guard';
import { createSupabaseJwks } from '@api/core/auth/supabase-jwks';
import { SupabaseJwtService } from '@api/core/auth/supabase-jwt.service';
import type { ApplicationConfig } from '@api/core/config/app.config';

@Module({
  providers: [
    {
      provide: SUPABASE_JWKS,
      inject: [ConfigService],
      useFactory: (configService: ConfigService<ApplicationConfig, true>) =>
        createSupabaseJwks(configService),
    },
    SupabaseJwtService,
    SupabaseAuthGuard,
    {
      provide: APP_GUARD,
      useExisting: SupabaseAuthGuard,
    },
  ],
  exports: [SupabaseJwtService, SupabaseAuthGuard],
})
export class AuthModule {}
