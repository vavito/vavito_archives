import { Controller, Get } from '@nestjs/common';

import { HealthService, type HealthResponse } from '@api/modules/health/health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  check(): HealthResponse {
    return this.healthService.check();
  }
}
