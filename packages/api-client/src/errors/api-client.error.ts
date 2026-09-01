export interface ApiClientErrorDetails {
  code: string;
  details: unknown;
  message: string;
  path: string | null;
  requestId: string | null;
  statusCode: number;
  timestamp: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];

  return typeof value === 'string' && value.length > 0 ? value : null;
}

function readResponsePath(response: Response): string | null {
  if (!response.url) {
    return null;
  }

  try {
    return new URL(response.url).pathname;
  } catch {
    return null;
  }
}

function readResponseMessage(response: Response, contract: Record<string, unknown>): string {
  if (response.status >= 500) {
    return 'Algo deu errado do nosso lado. Tente novamente em alguns instantes.';
  }

  return (
    readString(contract, 'message') ?? 'Não foi possível concluir a solicitação. Tente novamente.'
  );
}

export class ApiClientError extends Error {
  readonly code: string;
  readonly details: unknown;
  readonly path: string | null;
  readonly requestId: string | null;
  readonly statusCode: number;
  readonly timestamp: string | null;

  constructor(error: ApiClientErrorDetails, options?: ErrorOptions) {
    super(error.message, options);
    this.name = 'ApiClientError';
    this.code = error.code;
    this.details = error.details;
    this.path = error.path;
    this.requestId = error.requestId;
    this.statusCode = error.statusCode;
    this.timestamp = error.timestamp;
  }

  static fromResponse(response: Response, body: unknown): ApiClientError {
    const contract = isRecord(body) ? body : {};

    return new ApiClientError({
      code: readString(contract, 'code') ?? `HTTP_${response.status}`,
      details: contract.details ?? null,
      message: readResponseMessage(response, contract),
      path: readString(contract, 'path') ?? readResponsePath(response),
      requestId: readString(contract, 'requestId') ?? response.headers.get('x-request-id') ?? null,
      statusCode: response.status,
      timestamp: readString(contract, 'timestamp'),
    });
  }

  static missingAccessToken(): ApiClientError {
    return new ApiClientError({
      code: 'AUTH_TOKEN_MISSING',
      details: null,
      message: 'Entre na sua conta para continuar.',
      path: null,
      requestId: null,
      statusCode: 0,
      timestamp: null,
    });
  }

  static network(cause: unknown): ApiClientError {
    return new ApiClientError(
      {
        code: 'NETWORK_ERROR',
        details: null,
        message: 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
        path: null,
        requestId: null,
        statusCode: 0,
        timestamp: null,
      },
      { cause },
    );
  }

  static timeout(cause: unknown): ApiClientError {
    return new ApiClientError(
      {
        code: 'REQUEST_TIMEOUT',
        details: null,
        message: 'O servidor demorou mais que o esperado. Tente novamente.',
        path: null,
        requestId: null,
        statusCode: 0,
        timestamp: null,
      },
      { cause },
    );
  }
}
