import { Module } from '@nestjs/common';

import { HealthController } from '@api/modules/health/health.controller';
import { HealthService } from '@api/modules/health/health.service';

@Module({
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
