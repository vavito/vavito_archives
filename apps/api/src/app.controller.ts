import { Controller, Get } from '@nestjs/common';

import { AppService } from '@api/app.service';
import { Public } from '@api/core/auth/decorators/public.decorator';

@Public()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getRoot(): { name: string; status: string } {
    return this.appService.getRoot();
  }
}
