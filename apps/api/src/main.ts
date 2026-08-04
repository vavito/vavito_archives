import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

import { AppModule } from '@api/app.module';
import type { ApplicationConfig } from '@api/core/config/app.config';
import { setupOpenApi } from '@api/core/openapi/setup-openapi';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<ApplicationConfig, true>);
  const port = configService.get('app.port', { infer: true });

  app.setGlobalPrefix('api/v1');
  setupOpenApi(app, configService);

  await app.listen(port);
}

void bootstrap();
