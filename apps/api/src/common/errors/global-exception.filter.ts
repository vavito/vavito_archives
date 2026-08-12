import { randomUUID } from 'node:crypto';

import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

import { ApplicationException } from '@api/common/errors/application.exception';
import type { ErrorResponseDto } from '@api/common/errors/dto/error-response.dto';
import { errorCodeForStatus } from '@api/common/errors/error-codes';

interface HttpRequest {
  headers?: Record<string, string | string[] | undefined>;
  originalUrl?: string;
  url: string;
}

interface HttpResponse {
  json(body: ErrorResponseDto): unknown;
  setHeader(name: string, value: string): void;
  status(statusCode: number): HttpResponse;
}

interface NormalizedError {
  code: string;
  details: ErrorResponseDto['details'];
  message: string;
  statusCode: number;
}

const publicMessagesByStatus: Readonly<Partial<Record<number, string>>> = {
  [HttpStatus.BAD_REQUEST]: 'Dados inválidos.',
  [HttpStatus.UNAUTHORIZED]: 'Autenticação necessária.',
  [HttpStatus.FORBIDDEN]: 'Acesso não autorizado.',
  [HttpStatus.NOT_FOUND]: 'Rota não encontrada.',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'Erro interno do servidor.',
  [HttpStatus.NOT_IMPLEMENTED]: 'Erro interno do servidor.',
  [HttpStatus.BAD_GATEWAY]: 'Serviço temporariamente indisponível.',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'Serviço temporariamente indisponível.',
  [HttpStatus.GATEWAY_TIMEOUT]: 'Serviço temporariamente indisponível.',
};

function isSafeRequestId(value: string): boolean {
  return /^[a-zA-Z0-9._:-]{1,128}$/.test(value);
}

function requestIdFrom(request: HttpRequest): string {
  const header = request.headers?.['x-request-id'];
  const candidate = Array.isArray(header) ? header[0] : header;

  return candidate && isSafeRequestId(candidate) ? candidate : randomUUID();
}

function messageFromHttpException(exception: HttpException, statusCode: number): string {
  const configuredMessage = publicMessagesByStatus[statusCode];

  if (configuredMessage) {
    return configuredMessage;
  }

  const response = exception.getResponse();

  if (typeof response === 'string') {
    return response;
  }

  const message: unknown = 'message' in response ? response.message : undefined;

  return typeof message === 'string' ? message : (HttpStatus[statusCode] ?? 'Erro HTTP.');
}

function normalizeException(exception: unknown): NormalizedError {
  if (exception instanceof ApplicationException) {
    const statusCode = exception.getStatus();

    if (statusCode >= 500) {
      return {
        code: errorCodeForStatus(statusCode),
        details: null,
        message: publicMessagesByStatus[statusCode] ?? 'Erro interno do servidor.',
        statusCode,
      };
    }

    return {
      code: exception.code,
      details: exception.details,
      message: exception.message,
      statusCode,
    };
  }

  if (exception instanceof HttpException) {
    const statusCode = exception.getStatus();

    return {
      code: errorCodeForStatus(statusCode),
      details: null,
      message: messageFromHttpException(exception, statusCode),
      statusCode,
    };
  }

  return {
    code: 'INTERNAL_ERROR',
    details: null,
    message: 'Erro interno do servidor.',
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
  };
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter<unknown> {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<HttpRequest>();
    const response = context.getResponse<HttpResponse>();
    const normalizedError = normalizeException(exception);
    const requestId = requestIdFrom(request);

    if (!(exception instanceof HttpException) || exception.getStatus() >= 500) {
      this.logger.error(
        `Falha inesperada em ${request.originalUrl ?? request.url} [requestId=${requestId}]`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const body: ErrorResponseDto = {
      ...normalizedError,
      path: request.originalUrl ?? request.url,
      requestId,
      timestamp: new Date().toISOString(),
    };

    response.setHeader('x-request-id', requestId);
    response.status(normalizedError.statusCode).json(body);
  }
}
