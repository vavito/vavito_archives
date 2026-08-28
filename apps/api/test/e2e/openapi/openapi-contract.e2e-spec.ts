import { readFile } from 'node:fs/promises';
import type { Server } from 'node:http';
import { resolve } from 'node:path';

import type { INestApplication } from '@nestjs/common';
import type { OpenAPIObject } from '@nestjs/swagger';
import request from 'supertest';

import { createApplication } from '@api/bootstrap';

const HTTP_METHODS = ['delete', 'get', 'patch', 'post', 'put'] as const;
const ERROR_SCHEMA_REFERENCE = '#/components/schemas/ErrorResponseDto';

type OperationObject = NonNullable<OpenAPIObject['paths'][string]['get']>;
type SchemaObject = NonNullable<NonNullable<OpenAPIObject['components']>['schemas']>[string];

interface DocumentedOperation {
  label: string;
  operation: OperationObject;
}

interface ReferenceObject {
  $ref: string;
}

function isReference(value: object): value is ReferenceObject {
  return '$ref' in value;
}

function operations(document: OpenAPIObject): DocumentedOperation[] {
  return Object.entries(document.paths).flatMap(([path, pathItem]) =>
    HTTP_METHODS.flatMap((method) => {
      const operation = pathItem?.[method];
      return operation ? [{ label: `${method.toUpperCase()} ${path}`, operation }] : [];
    }),
  );
}

function configuredParameterExample(document: OpenAPIObject, schema: object | undefined): unknown {
  if (!schema) return undefined;
  if (isReference(schema)) {
    return configuredParameterExample(document, schemaByReference(document, schema.$ref));
  }

  const example: unknown = 'example' in schema ? schema.example : undefined;
  if (example !== undefined) return example;

  const defaultValue: unknown = 'default' in schema ? schema.default : undefined;
  if (defaultValue !== undefined) return defaultValue;

  const enumValues: unknown = 'enum' in schema ? schema.enum : undefined;
  return Array.isArray(enumValues) ? enumValues[0] : undefined;
}

function schemaByReference(document: OpenAPIObject, reference: string): SchemaObject | undefined {
  const name = reference.split('/').at(-1);
  return name ? document.components?.schemas?.[name] : undefined;
}

function schemaHasExamples(
  document: OpenAPIObject,
  schema: SchemaObject | undefined,
  visited = new Set<string>(),
): boolean {
  if (!schema) return false;
  if ('example' in schema && schema.example !== undefined) return true;
  if ('default' in schema && schema.default !== undefined) return true;
  if ('format' in schema && schema.format === 'binary') return true;

  if (isReference(schema)) {
    if (visited.has(schema.$ref)) return true;
    return schemaHasExamples(
      document,
      schemaByReference(document, schema.$ref),
      new Set(visited).add(schema.$ref),
    );
  }

  if (schema.allOf?.length) {
    return schema.allOf.every((item) => schemaHasExamples(document, item, visited));
  }
  if (schema.items) return schemaHasExamples(document, schema.items, visited);
  if (schema.properties) {
    return Object.values(schema.properties).every((item) =>
      schemaHasExamples(document, item, visited),
    );
  }

  return schema.type === 'object' && Boolean(schema.additionalProperties);
}

describe('Contrato OpenAPI completo (e2e)', () => {
  let app: INestApplication;
  let document: OpenAPIObject;

  beforeAll(async () => {
    app = await createApplication();
    await app.init();
    const response = await request(app.getHttpServer() as Server)
      .get('/openapi.json')
      .expect(200);
    document = response.body as OpenAPIObject;
  });

  afterAll(async () => {
    await app.close();
  });

  it('documenta cada operação com tag, resumo e operationId único', () => {
    const documentedOperations = operations(document);
    const operationIds = documentedOperations.map(({ operation }) => operation.operationId);
    const declaredTags = new Set(document.tags?.map(({ name }) => name));

    expect(documentedOperations.length).toBeGreaterThan(0);
    expect(new Set(operationIds).size).toBe(operationIds.length);

    for (const { operation } of documentedOperations) {
      expect(operation.operationId).toBeTruthy();
      expect(operation.summary).toBeTruthy();
      expect(operation.tags?.length).toBeGreaterThan(0);
      for (const tag of operation.tags ?? []) expect(declaredTags.has(tag)).toBe(true);
    }
  });

  it('documenta erros globais, autenticação e requestId', () => {
    for (const { operation } of operations(document)) {
      const internalError = operation.responses['500'];
      expect(internalError).toBeDefined();

      const requiresBearer = operation.security?.some((requirement) => requirement['supabase-jwt']);
      if (requiresBearer) {
        expect(operation.responses['401']).toBeDefined();
        expect(operation.responses['403']).toBeDefined();
      }

      for (const [status, response] of Object.entries(operation.responses)) {
        expect(response).toBeDefined();
        if (!response || isReference(response)) continue;
        expect(response.headers?.['X-Request-Id']).toBeDefined();

        if (!/^[45]\d\d$/.test(status)) continue;
        const media = response.content?.['application/json'];
        expect(media).toBeDefined();
        expect(media?.schema).toBeDefined();
        expect(
          media?.example ?? media?.examples ?? schemaHasExamples(document, media?.schema),
        ).toBeTruthy();
      }

      if (internalError && !isReference(internalError)) {
        expect(internalError.content?.['application/json']?.schema).toEqual({
          $ref: ERROR_SCHEMA_REFERENCE,
        });
      }
    }
  });

  it('mantém exemplos em parâmetros, requests e responses de sucesso', () => {
    for (const { operation } of operations(document)) {
      for (const parameter of operation.parameters ?? []) {
        if (isReference(parameter)) continue;
        expect(
          parameter.example ?? configuredParameterExample(document, parameter.schema),
        ).toBeDefined();
      }

      if (operation.requestBody && !isReference(operation.requestBody)) {
        for (const media of Object.values(operation.requestBody.content)) {
          expect(media.example ?? schemaHasExamples(document, media.schema)).toBeTruthy();
        }
      }

      for (const [status, response] of Object.entries(operation.responses)) {
        if (!/^2\d\d$/.test(status) || !response || isReference(response)) continue;
        for (const media of Object.values(response.content ?? {})) {
          expect(media.example ?? schemaHasExamples(document, media.schema)).toBeTruthy();
        }
      }
    }
  });

  it('mantém o artefato exportado alinhado às operações servidas', async () => {
    const exportedPath = resolve(process.cwd(), '../../packages/api-client/openapi/openapi.json');
    const parsedDocument: unknown = JSON.parse(await readFile(exportedPath, 'utf8'));
    const exported = parsedDocument as OpenAPIObject;
    const runtimeDocument = structuredClone(document);
    runtimeDocument.info.version = exported.info.version;

    expect(exported.info.title).toBe('Vavito Archives API');
    expect(exported.components?.securitySchemes?.['supabase-jwt']).toBeDefined();
    expect(exported).toEqual(runtimeDocument);
  });
});
