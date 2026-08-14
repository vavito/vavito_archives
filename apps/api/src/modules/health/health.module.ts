import { Module } from '@nestjs/common';

import { HealthController } from '@api/modules/health/controllers/health.controller';
import { HealthService } from '@api/modules/health/services/health.service';

@Module({
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
