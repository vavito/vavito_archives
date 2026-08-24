import type { ConfigService } from '@nestjs/config';

import type { ApplicationConfig } from '@api/core/config/app.config';
import { PrismaService } from '@api/core/database/prisma.service';

import { requireIntegrationDatabaseUrl } from './database-url';

export function createIntegrationPrisma(): PrismaService {
  const connectionString = requireIntegrationDatabaseUrl();
  const configService = {
    get: (path: string) => {
      if (path === 'database.connectOnStart') return true;
      if (path === 'database.url') return connectionString;

      throw new Error(`Configuração inesperada no teste: ${path}`);
    },
  } as unknown as ConfigService<ApplicationConfig, true>;

  return new PrismaService(configService);
}
