import type { INestApplication } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { ErrorDetailDto, ErrorResponseDto } from '@api/common/errors/dto/error-response.dto';
import type { ApplicationConfig } from '@api/core/config/app.config';

export function setupOpenApi(
  app: INestApplication,
  configService: ConfigService<ApplicationConfig, true>,
): void {
  const enabled = configService.get('app.swaggerEnabled', { infer: true });

  if (!enabled) {
    return;
  }

  const version = configService.get('app.version', { infer: true });
  const options = new DocumentBuilder()
    .setTitle('Vavito Archives API')
    .setDescription('Contrato HTTP da API do Vavito Archives.')
    .setVersion(version)
    .addBearerAuth(
      {
        bearerFormat: 'JWT',
        description: 'Access token do Supabase Auth.',
        scheme: 'bearer',
        type: 'http',
      },
      'supabase-jwt',
    )
    .build();
  const documentFactory = () =>
    SwaggerModule.createDocument(app, options, {
      autoTagControllers: false,
      extraModels: [ErrorDetailDto, ErrorResponseDto],
      operationIdFactory: (_controllerKey, methodKey) => methodKey,
    });

  SwaggerModule.setup('docs', app, documentFactory, {
    customSiteTitle: 'Vavito Archives API Docs',
    jsonDocumentUrl: 'openapi.json',
    raw: ['json'],
  });
}
