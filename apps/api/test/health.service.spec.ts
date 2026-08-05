import { ServiceUnavailableException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';

import type { ApplicationConfig } from '@api/core/config/app.config';
import type { PrismaService } from '@api/core/database/prisma.service';
import { HealthService } from '@api/modules/health/health.service';

function createHealthService() {
  const configService = {
    get: jest.fn().mockReturnValue('1.2.3-test'),
  } as unknown as ConfigService<ApplicationConfig, true>;
  const prismaService = {
    checkReadiness: jest.fn(),
  } as unknown as PrismaService;

  return {
    healthService: new HealthService(configService, prismaService),
    prismaService,
  };
}

describe('HealthService readiness', () => {
  it('informa que o banco está disponível quando a consulta responde', async () => {
    const { healthService, prismaService } = createHealthService();
    jest.spyOn(prismaService, 'checkReadiness').mockResolvedValue();

    await expect(healthService.checkReadiness()).resolves.toMatchObject({
      checks: { database: { status: 'up' } },
      status: 'ok',
    });
  });

  it('responde 503 sem expor detalhes internos quando o banco falha', async () => {
    const { healthService, prismaService } = createHealthService();
    jest.spyOn(prismaService, 'checkReadiness').mockRejectedValue(new Error('segredo interno'));

    await expect(healthService.checkReadiness()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );

    try {
      await healthService.checkReadiness();
    } catch (error) {
      const response = (error as ServiceUnavailableException).getResponse();

      expect(response).toMatchObject({
        checks: { database: { status: 'down' } },
        status: 'error',
      });
      expect(JSON.stringify(response)).not.toContain('segredo interno');
    }
  });
});
