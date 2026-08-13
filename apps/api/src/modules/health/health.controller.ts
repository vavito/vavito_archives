import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';

import { Public } from '@api/core/auth/decorators/public.decorator';
import { HealthResponseDto } from '@api/modules/health/dto/health-response.dto';
import { ReadinessResponseDto } from '@api/modules/health/dto/readiness-response.dto';
import { HealthService } from '@api/modules/health/health.service';

@ApiTags('Health')
@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Verifica se o processo da API está ativo' })
  @ApiOkResponse({ description: 'A API está ativa.', type: HealthResponseDto })
  check(): HealthResponseDto {
    return this.healthService.check();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Verifica se a API consegue acessar o banco de dados' })
  @ApiOkResponse({
    description: 'A API está pronta para receber tráfego.',
    type: ReadinessResponseDto,
  })
  @ApiServiceUnavailableResponse({
    description: 'A API ainda não consegue acessar o banco de dados.',
    type: ReadinessResponseDto,
  })
  checkReadiness(): Promise<ReadinessResponseDto> {
    return this.healthService.checkReadiness();
  }
}
