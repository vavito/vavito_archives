import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from '@api/app.controller';
import { AppService } from '@api/app.service';
import configuration, { environmentFilePaths } from '@api/core/config/configuration';
import { validateEnvironment } from '@api/core/config/env.validation';
import { HealthModule } from '@api/modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      envFilePath: environmentFilePaths,
      isGlobal: true,
      load: [configuration],
      validate: validateEnvironment,
    }),
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
