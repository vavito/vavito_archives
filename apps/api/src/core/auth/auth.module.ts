import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import { SUPABASE_JWKS } from '@api/core/auth/constants/auth.constants';
import { SupabaseAuthGuard } from '@api/core/auth/guards/supabase-auth.guard';
import { RolesGuard } from '@api/core/auth/guards/roles.guard';
import { PrismaProfileAuthorizationRepository } from '@api/core/auth/repositories/prisma-profile-authorization.repository';
import { ProfileAuthorizationRepository } from '@api/core/auth/repositories/profile-authorization.repository';
import { createSupabaseJwks } from '@api/core/auth/providers/supabase-jwks.provider';
import { SupabaseJwtService } from '@api/core/auth/services/supabase-jwt.service';
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
    RolesGuard,
    {
      provide: ProfileAuthorizationRepository,
      useClass: PrismaProfileAuthorizationRepository,
    },
    {
      provide: APP_GUARD,
      useExisting: SupabaseAuthGuard,
    },
    {
      provide: APP_GUARD,
      useExisting: RolesGuard,
    },
  ],
  exports: [SupabaseJwtService, SupabaseAuthGuard, RolesGuard],
})
export class AuthModule {}
