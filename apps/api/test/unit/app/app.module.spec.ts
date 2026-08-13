import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';

import { AppController } from '@api/app.controller';
import { AppModule } from '@api/app.module';
import { AppService } from '@api/app.service';
import { SupabaseAuthGuard } from '@api/core/auth/guards/supabase-auth.guard';
import { RolesGuard } from '@api/core/auth/guards/roles.guard';
import { SupabaseJwtService } from '@api/core/auth/supabase-jwt.service';
import type { ApplicationConfig } from '@api/core/config/app.config';
import { PrismaService } from '@api/core/database/prisma.service';
import { HealthController } from '@api/modules/health/health.controller';
import { HealthService } from '@api/modules/health/health.service';

describe('AppModule', () => {
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('carrega os módulos essenciais e a configuração validada', () => {
    const configService = moduleRef.get(ConfigService<ApplicationConfig, true>);

    expect(moduleRef.get(AppController)).toBeInstanceOf(AppController);
    expect(moduleRef.get(AppService)).toBeInstanceOf(AppService);
    expect(moduleRef.get(PrismaService)).toBeDefined();
    expect(moduleRef.get(SupabaseJwtService)).toBeInstanceOf(SupabaseJwtService);
    expect(moduleRef.get(SupabaseAuthGuard)).toBeInstanceOf(SupabaseAuthGuard);
    expect(moduleRef.get(RolesGuard)).toBeInstanceOf(RolesGuard);
    expect(moduleRef.get(HealthController)).toBeInstanceOf(HealthController);
    expect(moduleRef.get(HealthService)).toBeInstanceOf(HealthService);
    expect(configService.get('app.environment', { infer: true })).toBe('test');
    expect(configService.get('app.version', { infer: true })).toBe('1.2.3-test');
    expect(configService.get('database.connectOnStart', { infer: true })).toBe(false);
  });
});
