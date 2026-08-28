import type { INestApplication } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { SwaggerModule } from '@nestjs/swagger';

import type { ApplicationConfig } from '@api/core/config/app.config';
import { createOpenApiDocument } from '@api/core/openapi/create-openapi-document';

export function setupOpenApi(
  app: INestApplication,
  configService: ConfigService<ApplicationConfig, true>,
): void {
  const enabled = configService.get('app.swaggerEnabled', { infer: true });

  if (!enabled) {
    return;
  }

  const documentFactory = () => createOpenApiDocument(app, configService);

  SwaggerModule.setup('docs', app, documentFactory, {
    customSiteTitle: 'Vavito Archives API Docs',
    jsonDocumentUrl: 'openapi.json',
    raw: ['json'],
  });
}
