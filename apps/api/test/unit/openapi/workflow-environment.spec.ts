import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { validateEnvironment } from '@api/core/config/env.validation';

const workflow = readFileSync(
  resolve(__dirname, '../../../../../.github/workflows/quality.yml'),
  'utf8',
).replaceAll('\r\n', '\n');
const apiJob = workflow.split('\n  web:')[0]!;
const exportStep = apiJob.split('      - name: Verificar exportação do contrato OpenAPI\n')[1]!;

function declaredEnvironment(source: string, indent: number): Record<string, string> {
  const pattern = new RegExp(`^ {${indent}}([A-Z_]+): (.+)$`, 'gm');
  return Object.fromEntries(
    [...source.matchAll(pattern)].map((match) => [
      match[1]!,
      match[2]!.startsWith("'")
        ? match[2]!.slice(1, -1).replaceAll("''", "'")
        : match[2]!.startsWith('"')
          ? (JSON.parse(match[2]!) as string)
          : match[2]!,
    ]),
  );
}

describe('ambiente da exportação OpenAPI na CI', () => {
  it('valida apenas as variáveis declaradas no workflow, sem herdar o setup do Jest ou .env', () => {
    const environment = validateEnvironment({
      ...declaredEnvironment(apiJob.split('    services:')[0]!, 6),
      ...declaredEnvironment(exportStep.split('        run:')[0]!, 10),
      APP_VERSION: '0.1.0-rc.3',
    });

    expect(environment.NODE_ENV).toBe('test');
    expect(environment.DATABASE_CONNECT_ON_START).toBe(false);
    expect(new URL(environment.SUPABASE_URL).hostname).toBe('127.0.0.1');
    expect(new URL(environment.FRONTEND_URL).hostname).toBe('localhost');
    expect(exportStep).toContain("require('./package.json').version");
    expect(exportStep).toContain(
      'git diff --exit-code -- packages/api-client/openapi/openapi.json',
    );
    expect(exportStep).not.toContain('secrets.');
  });

  it('reproduz a falha se a etapa não fornecer as variáveis obrigatórias', () => {
    expect(() =>
      validateEnvironment(declaredEnvironment(apiJob.split('    services:')[0]!, 6)),
    ).toThrow('Invalid environment configuration');
  });
});
