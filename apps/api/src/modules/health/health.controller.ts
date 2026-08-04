import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { HealthResponseDto } from '@api/modules/health/dto/health-response.dto';
import { HealthService } from '@api/modules/health/health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Verifica se o processo da API está ativo' })
  @ApiOkResponse({ description: 'A API está ativa.', type: HealthResponseDto })
  check(): HealthResponseDto {
    return this.healthService.check();
  }
}
