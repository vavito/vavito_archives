import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { ApplicationConfig } from '@api/core/config/app.config';

export interface HealthResponse {
  checks: {
    api: {
      status: 'up';
    };
  };
  status: 'ok';
  timestamp: string;
  version: string;
}

@Injectable()
export class HealthService {
  constructor(private readonly configService: ConfigService<ApplicationConfig, true>) {}

  check(): HealthResponse {
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
