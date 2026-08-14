import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { ApplicationConfig } from '@api/core/config/app.config';
import { PrismaService } from '@api/core/database/prisma.service';
import type { HealthResponseDto } from '@api/modules/health/dto/health-response.dto';
import type { ReadinessResponseDto } from '@api/modules/health/dto/readiness-response.dto';

@Injectable()
export class HealthService {
  constructor(
    private readonly configService: ConfigService<ApplicationConfig, true>,
    private readonly prismaService: PrismaService,
  ) {}

  check(): HealthResponseDto {
    return {
      checks: {
        api: {
          status: 'up',
        },
      },
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: this.configService.get('app.version', { infer: true }),
    };
  }

  async checkReadiness(): Promise<ReadinessResponseDto> {
    try {
      await this.prismaService.checkReadiness();

      return {
        checks: {
          database: {
            status: 'up',
          },
        },
        status: 'ok',
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException({
        checks: {
          database: {
            status: 'down',
          },
        },
        status: 'error',
        timestamp: new Date().toISOString(),
      } satisfies ReadinessResponseDto);
    }
  }
}
