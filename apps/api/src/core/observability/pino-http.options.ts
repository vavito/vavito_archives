import type { IncomingMessage, ServerResponse } from 'node:http';

import type { Options } from 'pino-http';

import type { LogLevel } from '@api/core/config/app.config';
import { assignRequestId, requestIdFrom } from '@api/core/observability/request-id';

interface SerializedLogError {
  name?: string;
  type?: string;
}

const redactedPaths = [
  'accessToken',
  'authorization',
  'cookie',
  'password',
  'refreshToken',
  'secret',
  'token',
  '*.accessToken',
  '*.authorization',
  '*.cookie',
  '*.password',
  '*.refreshToken',
  '*.secret',
  '*.token',
  '*.*.accessToken',
  '*.*.authorization',
  '*.*.cookie',
  '*.*.password',
  '*.*.refreshToken',
  '*.*.secret',
  '*.*.token',
  'req.body.accessToken',
  'req.body.password',
  'req.body.refreshToken',
  'req.body.secret',
  'req.body.token',
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["x-api-key"]',
] as const;

function requestPath(request: IncomingMessage): string | undefined {
  return request.url?.split('?', 1)[0];
}

export function createPinoHttpOptions(level: LogLevel): Options {
  return {
    autoLogging: true,
    customAttributeKeys: { responseTime: 'durationMs' },
    customErrorMessage: () => 'Requisição falhou.',
    customLogLevel: (_request, response, error) => {
      if (error || response.statusCode >= 500) return 'error';
      if (response.statusCode >= 400) return 'warn';
      return 'info';
    },
    customProps: (request) => ({ requestId: requestIdFrom(request) }),
    customReceivedMessage: () => 'Requisição recebida.',
    customSuccessMessage: () => 'Requisição concluída.',
    genReqId: (request, response) => assignRequestId(request, response),
    level,
    redact: { censor: '[Redacted]', paths: [...redactedPaths] },
    serializers: {
      err: (error: SerializedLogError) => ({ errorType: error.type ?? error.name ?? 'Error' }),
      req: (request: IncomingMessage) => ({
        method: request.method,
        path: requestPath(request),
      }),
      res: (response: ServerResponse) => ({ statusCode: response.statusCode }),
    },
    wrapSerializers: false,
  };
}
