import type { ConfigService } from '@nestjs/config';

import type { ApplicationConfig } from '@api/core/config/app.config';
import { PrismaService } from '@api/core/database/prisma.service';

import { requireIntegrationDatabaseUrl } from '../../helpers/database-url';

const connectionString = requireIntegrationDatabaseUrl();

describe('PrismaService com PostgreSQL real', () => {
  it('conecta, responde ao readiness e desconecta pelo ciclo de vida', async () => {
    const configService = {
      get: jest.fn((path: string) => {
        if (path === 'database.connectOnStart') {
          return true;
        }

        if (path === 'database.url') {
          return connectionString;
        }

        throw new Error(`Configuração inesperada no teste: ${path}`);
      }),
    } as unknown as ConfigService<ApplicationConfig, true>;
    const prismaService = new PrismaService(configService);

    try {
      await prismaService.onModuleInit();
      await expect(prismaService.checkReadiness()).resolves.toBeUndefined();
      await expect(
        prismaService.$queryRaw<Array<{ current_database: string }>>`SELECT current_database()`,
      ).resolves.toEqual([{ current_database: 'vavito_integration' }]);
    } finally {
      await prismaService.onModuleDestroy();
    }
  });
});
