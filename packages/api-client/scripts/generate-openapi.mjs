import { mkdir, readFile, writeFile } from 'node:fs/promises';

import openapiTS, { astToString } from 'openapi-typescript';
import { format } from 'prettier';

import prettierConfig from '../../../prettier.config.mjs';

const schemaUrl = new URL('../openapi/openapi.json', import.meta.url);
const generatedDirectoryUrl = new URL('../src/generated/', import.meta.url);
const generatedFileUrl = new URL('../src/generated/schema.ts', import.meta.url);
const shouldWrite = process.argv.includes('--write');

const nodes = await openapiTS(schemaUrl);
const generatedSource = await format(astToString(nodes), {
  ...prettierConfig,
  parser: 'typescript',
});

if (shouldWrite) {
  await mkdir(generatedDirectoryUrl, { recursive: true });
  await writeFile(generatedFileUrl, generatedSource, 'utf8');
  console.log('Tipos OpenAPI atualizados em src/generated/schema.ts.');
  process.exit(0);
}

const currentSource = await readFile(generatedFileUrl, 'utf8').catch(() => null);

if (currentSource !== generatedSource) {
  console.error('Os tipos OpenAPI estão desatualizados. Execute pnpm api-client:generate.');
  process.exit(1);
}

console.log('Os tipos OpenAPI estão sincronizados com openapi/openapi.json.');
