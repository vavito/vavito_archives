import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Logger as PinoLogger } from 'nestjs-pino';

import { AppModule } from '@api/app.module';
import { setupErrorHandling } from '@api/core/http/setup-error-handling';
import { setupHttpSecurity } from '@api/core/http/security/setup-http-security';
import type { ApplicationConfig } from '@api/core/config/app.config';
import { setupOpenApi } from '@api/core/openapi/setup-openapi';

export const globalApiPrefix = 'api/v1';

export function configureApplication(
  app: INestApplication,
  configService: ConfigService<ApplicationConfig, true>,
): INestApplication {
  app.enableShutdownHooks();
  app.setGlobalPrefix(globalApiPrefix);
  setupHttpSecurity(app, configService);
  setupErrorHandling(app);
  setupOpenApi(app, configService);

  return app;
}

export async function createApplication(): Promise<INestApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    rawBody: true,
  });
  app.useLogger(app.get(PinoLogger));
  app.set('trust proxy', 1);
  const configService = app.get(ConfigService<ApplicationConfig, true>);

  return configureApplication(app, configService);
}

export async function startApplication(): Promise<void> {
  const app = await createApplication();
  const configService = app.get(ConfigService<ApplicationConfig, true>);
  const port = configService.get('app.port', { infer: true });

  await app.listen(port);
}
