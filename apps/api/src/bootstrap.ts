import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from '@api/app.module';
import type { ApplicationConfig } from '@api/core/config/app.config';
import { setupOpenApi } from '@api/core/openapi/setup-openapi';

export const globalApiPrefix = 'api/v1';

export function configureApplication(
  app: INestApplication,
  configService: ConfigService<ApplicationConfig, true>,
): INestApplication {
  app.enableShutdownHooks();
  app.setGlobalPrefix(globalApiPrefix);
  setupOpenApi(app, configService);

  return app;
}

export async function createApplication(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<ApplicationConfig, true>);

  return configureApplication(app, configService);
}

export async function startApplication(): Promise<void> {
  const app = await createApplication();
  const configService = app.get(ConfigService<ApplicationConfig, true>);
  const port = configService.get('app.port', { infer: true });

  await app.listen(port);
}
