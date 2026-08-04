import { Module } from '@nestjs/common';

import { AppController } from '@api/app.controller';
import { AppService } from '@api/app.service';

@Module({
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
