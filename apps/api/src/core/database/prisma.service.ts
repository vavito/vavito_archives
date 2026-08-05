import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';

import type { ApplicationConfig } from '@api/core/config/app.config';
import { PrismaClient } from '@api/generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly connectOnStart: boolean;
  private readonly logger = new Logger(PrismaService.name);

  constructor(configService: ConfigService<ApplicationConfig, true>) {
    const adapter = new PrismaPg({
      connectionString: configService.get('database.url', { infer: true }),
    });

    super({ adapter });

    this.connectOnStart = configService.get('database.connectOnStart', { infer: true });
  }

  async onModuleInit(): Promise<void> {
    if (!this.connectOnStart) {
      return;
    }

    await this.$connect();
    this.logger.log('Conexão com o PostgreSQL estabelecida.');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  async checkReadiness(): Promise<void> {
    await this.$queryRaw`SELECT 1`;
  }
}
