import type { INestApplication } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { DocumentBuilder, type OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

import type { ApplicationConfig } from '@api/core/config/app.config';
import { ErrorDetailDto, ErrorResponseDto } from '@api/core/http/dto/error-response.dto';
import { HTTP_JSON_BODY_LIMIT_BYTES } from '@api/core/http/security/http-security.constants';
import {
  OPENAPI_REQUEST_ID_EXAMPLE,
  OPENAPI_SECURITY_SCHEME,
  OPENAPI_TAGS,
} from '@api/core/openapi/openapi.constants';

const HTTP_METHODS = ['delete', 'get', 'patch', 'post', 'put'] as const;

type OperationObject = NonNullable<OpenAPIObject['paths'][string]['get']>;
type ResponseEntry = NonNullable<OperationObject['responses'][string]>;
interface ReferenceObject {
  $ref: string;
}
type ResponseObject = Exclude<ResponseEntry, ReferenceObject>;

const ERROR_BY_STATUS: Readonly<Record<number, { code: string; message: string }>> = {
  400: { code: 'VALIDATION_ERROR', message: 'Dados inválidos.' },
  401: { code: 'UNAUTHENTICATED', message: 'Autenticação necessária.' },
  403: { code: 'FORBIDDEN', message: 'Acesso não autorizado.' },
  404: { code: 'RESOURCE_NOT_FOUND', message: 'Recurso não encontrado.' },
  409: { code: 'CONFLICT', message: 'Estado incompatível com a operação.' },
  410: { code: 'RESOURCE_EXPIRED', message: 'O recurso informado expirou.' },
  413: { code: 'PAYLOAD_TOO_LARGE', message: 'Payload acima do limite permitido.' },
  415: { code: 'UNSUPPORTED_MEDIA_TYPE', message: 'Tipo de conteúdo não suportado.' },
  422: { code: 'UNPROCESSABLE_ENTITY', message: 'Conteúdo semanticamente inválido.' },
  429: { code: 'RATE_LIMIT_EXCEEDED', message: 'Limite de solicitações excedido.' },
  500: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' },
  503: { code: 'SERVICE_UNAVAILABLE', message: 'Serviço temporariamente indisponível.' },
};

function operationId(controllerKey: string, methodKey: string): string {
  const controller = controllerKey.replace(/Controller$/, '');
  const resource = `${controller.slice(0, 1).toLowerCase()}${controller.slice(1)}`;

  return `${resource}_${methodKey}`;
}

function errorExample(statusCode: number, path: string) {
  const fallback = ERROR_BY_STATUS[500]!;
  const error = ERROR_BY_STATUS[statusCode] ?? fallback;

  return {
    code: error.code,
    details: null,
    message: error.message,
    path,
    requestId: OPENAPI_REQUEST_ID_EXAMPLE,
    statusCode,
    timestamp: '2026-08-27T20:15:00.000Z',
  };
}

function errorResponse(statusCode: number, path: string, description: string): ResponseObject {
  return {
    content: {
      'application/json': {
        example: errorExample(statusCode, path),
        schema: { $ref: '#/components/schemas/ErrorResponseDto' },
      },
    },
    description,
  };
}

function isReference(value: object): value is ReferenceObject {
  return '$ref' in value;
}

function documentsBearerAuth(operation: OperationObject): boolean {
  return Boolean(operation.security?.some((requirement) => OPENAPI_SECURITY_SCHEME in requirement));
}

function hasValidatedInput(operation: OperationObject): boolean {
  return Boolean(operation.requestBody || operation.parameters?.length);
}

function parameterExample(name: string): string | number | undefined {
  const normalizedName = name.toLowerCase();

  if (normalizedName === 'id' || normalizedName.endsWith('id')) {
    return '019c2d62-6e90-7000-8000-000000000010';
  }
  if (normalizedName === 'slug') return 'arquitetura-aplicacoes-nestjs';
  if (normalizedName === 'page') return 1;
  if (normalizedName === 'limit') return 20;

  return undefined;
}

function configuredParameterExample(
  schema: object | undefined,
  document: OpenAPIObject,
): string | number | boolean | undefined {
  if (!schema) return undefined;
  if (isReference(schema)) {
    const schemaName = schema.$ref.split('/').at(-1);
    return schemaName
      ? configuredParameterExample(document.components?.schemas?.[schemaName], document)
      : undefined;
  }

  const example: unknown = 'example' in schema ? schema.example : undefined;
  if (typeof example === 'string' || typeof example === 'number' || typeof example === 'boolean') {
    return example;
  }

  const defaultValue: unknown = 'default' in schema ? schema.default : undefined;
  if (
    typeof defaultValue === 'string' ||
    typeof defaultValue === 'number' ||
    typeof defaultValue === 'boolean'
  ) {
    return defaultValue;
  }

  const enumValues: unknown = 'enum' in schema ? schema.enum : undefined;
  const firstEnumValue: unknown = Array.isArray(enumValues) ? enumValues[0] : undefined;
  if (
    typeof firstEnumValue === 'string' ||
    typeof firstEnumValue === 'number' ||
    typeof firstEnumValue === 'boolean'
  ) {
    return firstEnumValue;
  }

  return undefined;
}

function documentParameterExamples(operation: OperationObject, document: OpenAPIObject): void {
  for (const parameter of operation.parameters ?? []) {
    if (isReference(parameter) || parameter.example !== undefined) continue;

    const example =
      configuredParameterExample(parameter.schema, document) ?? parameterExample(parameter.name);

    if (example !== undefined) parameter.example = example;
  }
}

function documentErrors(operation: OperationObject, path: string): void {
  if (hasValidatedInput(operation) && !operation.responses['400']) {
    operation.responses['400'] = errorResponse(400, path, 'Dados ou parâmetros inválidos.');
  }

  if (documentsBearerAuth(operation)) {
    operation.responses['401'] ??= errorResponse(401, path, 'Autenticação necessária.');
    operation.responses['403'] ??= errorResponse(403, path, 'Acesso não autorizado.');
  }

  operation.responses['500'] ??= errorResponse(500, path, 'Falha interna inesperada.');

  for (const [status, response] of Object.entries(operation.responses)) {
    if (!response || !/^[45]\d\d$/.test(status) || isReference(response) || response.content) {
      continue;
    }

    const statusCode = Number(status);
    operation.responses[status] = errorResponse(statusCode, path, response.description);
  }
}

function documentRequestId(operation: OperationObject): void {
  for (const response of Object.values(operation.responses)) {
    if (!response || isReference(response)) continue;

    response.headers = {
      ...response.headers,
      'X-Request-Id': {
        description: 'Identificador usado para correlacionar a requisição nos logs.',
        schema: { example: OPENAPI_REQUEST_ID_EXAMPLE, format: 'uuid', type: 'string' },
      },
    };
  }
}

function completeOperations(document: OpenAPIObject): OpenAPIObject {
  for (const [path, pathItem] of Object.entries(document.paths)) {
    for (const method of HTTP_METHODS) {
      const operation = pathItem?.[method];
      if (!operation) continue;

      documentErrors(operation, path);
      documentParameterExamples(operation, document);
      documentRequestId(operation);
    }
  }

  return document;
}

export function createOpenApiDocument(
  app: INestApplication,
  configService: ConfigService<ApplicationConfig, true>,
): OpenAPIObject {
  const version = configService.get('app.version', { infer: true });
  const bodyLimitMiB = HTTP_JSON_BODY_LIMIT_BYTES / 1_048_576;
  const builder = new DocumentBuilder()
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
      OPENAPI_SECURITY_SCHEME,
    );

  for (const tag of OPENAPI_TAGS) builder.addTag(tag.name, tag.description);

  const document = SwaggerModule.createDocument(app, builder.build(), {
    autoTagControllers: false,
    extraModels: [ErrorDetailDto, ErrorResponseDto],
    operationIdFactory: operationId,
  });

  return completeOperations(document);
}
