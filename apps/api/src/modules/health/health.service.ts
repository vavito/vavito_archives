import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { ApplicationConfig } from '@api/core/config/app.config';
import type { HealthResponseDto } from '@api/modules/health/dto/health-response.dto';

@Injectable()
export class HealthService {
  constructor(private readonly configService: ConfigService<ApplicationConfig, true>) {}

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
}
