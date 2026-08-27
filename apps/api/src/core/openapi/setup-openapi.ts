import type { INestApplication } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { ErrorDetailDto, ErrorResponseDto } from '@api/core/http/dto/error-response.dto';
import { HTTP_JSON_BODY_LIMIT_BYTES } from '@api/core/http/security/http-security.constants';
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
  const bodyLimitMiB = HTTP_JSON_BODY_LIMIT_BYTES / 1_048_576;
  const options = new DocumentBuilder()
    .setTitle('Vavito Archives API')
    .setDescription(
      `Contrato HTTP da API do Vavito Archives. Corpos JSON e URL-encoded aceitam no máximo ${bodyLimitMiB} MiB; uploads multipart possuem limites próprios por rota.`,
    )
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
