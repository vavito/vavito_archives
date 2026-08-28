import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from '@api/app.module';
import { globalApiPrefix } from '@api/bootstrap';
import type { ApplicationConfig } from '@api/core/config/app.config';
import { createOpenApiDocument } from '@api/core/openapi/create-openapi-document';

function workspaceRoot(start: string): string {
  let current = resolve(start);

  while (!existsSync(resolve(current, 'pnpm-workspace.yaml'))) {
    const parent = dirname(current);
    if (parent === current) throw new Error('Workspace root not found.');
    current = parent;
  }

  return current;
}

async function exportOpenApi(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: false });

  try {
    app.setGlobalPrefix(globalApiPrefix);
    const configService = app.get(ConfigService<ApplicationConfig, true>);
    const document = createOpenApiDocument(app, configService);
    const outputPath = resolve(
      workspaceRoot(process.cwd()),
      'packages/api-client/openapi/openapi.json',
    );

    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
    process.stdout.write(`OpenAPI exportado para ${outputPath}\n`);
  } finally {
    await app.close();
  }
}

void exportOpenApi();
