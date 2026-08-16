import type { ConfigService } from '@nestjs/config';

import type { ApplicationConfig } from '@api/core/config/app.config';
import { PrismaService } from '@api/core/database/prisma.service';

function createPrismaService(connectOnStart = true): PrismaService {
  const configService = {
    get: jest.fn((path: string) => {
      if (path === 'database.connectOnStart') {
        return connectOnStart;
      }

      if (path === 'database.url') {
        return 'postgresql://postgres:postgres@localhost:5432/vavito_test';
      }

      throw new Error(`Configuração inesperada no teste: ${path}`);
    }),
  } as unknown as ConfigService<ApplicationConfig, true>;

  return new PrismaService(configService);
}

describe('PrismaService', () => {
  it('conecta na inicialização e desconecta no encerramento', async () => {
    const prismaService = createPrismaService();
    const connect = jest.spyOn(prismaService, '$connect').mockResolvedValue();
    const disconnect = jest.spyOn(prismaService, '$disconnect').mockResolvedValue();

    await prismaService.onModuleInit();
    await prismaService.onModuleDestroy();

    expect(connect).toHaveBeenCalledTimes(1);
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it('permite desativar apenas a conexão inicial para testes sem PostgreSQL', async () => {
    const prismaService = createPrismaService(false);
    const connect = jest.spyOn(prismaService, '$connect').mockResolvedValue();

    await prismaService.onModuleInit();

    expect(connect).not.toHaveBeenCalled();
  });

  it('executa uma consulta mínima no teste de readiness', async () => {
    const prismaService = createPrismaService();
    const queryRaw = jest.spyOn(prismaService, '$queryRaw').mockResolvedValue([]);

    await prismaService.checkReadiness();

    expect(queryRaw).toHaveBeenCalledTimes(1);
  });
});
