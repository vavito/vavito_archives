import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AppService } from '@api/app.service';
import { Public } from '@api/core/auth/decorators/public.decorator';

@Public()
@ApiTags('API')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Identifica a API e seu estado básico' })
  @ApiOkResponse({
    schema: {
      example: { name: 'Vavito Archives API', status: 'running' },
      properties: {
        name: { example: 'Vavito Archives API', type: 'string' },
        status: { example: 'running', type: 'string' },
      },
      required: ['name', 'status'],
      type: 'object',
    },
  })
  getRoot(): { name: string; status: string } {
    return this.appService.getRoot();
  }
}
