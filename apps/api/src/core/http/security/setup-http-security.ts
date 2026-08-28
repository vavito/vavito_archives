import type { INestApplication } from '@nestjs/common';
import type { CustomOrigin } from '@nestjs/common/interfaces/external/cors-options.interface';
import type { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';

import type { ApplicationConfig } from '@api/core/config/app.config';
import {
  HTTP_JSON_BODY_LIMIT_BYTES,
  HTTP_URLENCODED_BODY_LIMIT_BYTES,
} from '@api/core/http/security/http-security.constants';

function helmetOptions(swaggerEnabled: boolean): Parameters<typeof helmet>[0] {
  if (!swaggerEnabled) return undefined;

  return {
    contentSecurityPolicy: {
      directives: {
        imgSrc: ["'self'", 'data:', 'https:'],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
      },
    },
  };
}

export function setupHttpSecurity(
  app: INestApplication,
  configService: ConfigService<ApplicationConfig, true>,
): void {
  const expressApp = app as NestExpressApplication;
  const allowedOrigins = new Set(configService.get('app.corsAllowedOrigins', { infer: true }));
  const swaggerEnabled = configService.get('app.swaggerEnabled', { infer: true });
  const origin: CustomOrigin = (requestOrigin, callback) => {
    callback(null, !requestOrigin || allowedOrigins.has(requestOrigin));
  };

  app.use(helmet(helmetOptions(swaggerEnabled)));
  app.enableCors({
    allowedHeaders: ['authorization', 'content-type', 'idempotency-key', 'x-request-id'],
    credentials: false,
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    origin,
  });
  expressApp.useBodyParser('json', { limit: HTTP_JSON_BODY_LIMIT_BYTES });
  expressApp.useBodyParser('urlencoded', {
    extended: true,
    limit: HTTP_URLENCODED_BODY_LIMIT_BYTES,
  });
}
