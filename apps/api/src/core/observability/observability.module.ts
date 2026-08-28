import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';

import type { ApplicationConfig } from '@api/core/config/app.config';
import { RequestLoggingInterceptor } from '@api/core/http/interceptors/request-logging.interceptor';
import { createPinoHttpOptions } from '@api/core/observability/pino-http.options';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<ApplicationConfig, true>) => ({
        assignResponse: true,
        pinoHttp: createPinoHttpOptions(configService.get('logging.level', { infer: true })),
      }),
    }),
  ],
  providers: [{ provide: APP_INTERCEPTOR, useClass: RequestLoggingInterceptor }],
})
export class ObservabilityModule {}
