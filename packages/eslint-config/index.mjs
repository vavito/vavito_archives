import eslint from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import prettier from 'eslint-config-prettier/flat';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const sourceFiles = ['**/*.{js,mjs,cjs,ts,tsx}'];

const commonConfig = defineConfig([
  globalIgnores([
    '**/.next/**',
    '**/.turbo/**',
    '**/coverage/**',
    '**/dist/**',
    '**/node_modules/**',
  ]),
  {
    ...eslint.configs.recommended,
    files: sourceFiles,
    name: 'vavito/javascript-recommended',
  },
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: ['**/*.{ts,tsx}'],
  })),
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: process.cwd(),
      },
    },
    name: 'vavito/typescript',
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { fixStyle: 'inline-type-imports', prefer: 'type-imports' },
      ],
      '@typescript-eslint/no-import-type-side-effects': 'error',
      eqeqeq: ['error', 'always'],
    },
  },
]);

const appBoundaryPatterns = {
  api: ['@vavito/api', '@vavito/api/*', '**/apps/api/**', '../**/api', '../**/api/**'],
  web: ['@vavito/web', '@vavito/web/*', '**/apps/web/**', '../**/web', '../**/web/**'],
};

function restrictedImports(patterns, message) {
  return [
    'error',
    {
      patterns: [{ group: patterns, message }],
    },
  ];
}

export const nestjsConfig = defineConfig([
  ...commonConfig,
  {
    files: sourceFiles,
    languageOptions: { globals: globals.node },
    name: 'vavito/nestjs',
    rules: {
      'no-restricted-imports': restrictedImports(
        appBoundaryPatterns.web,
        'A API não pode importar arquivos da aplicação web.',
      ),
    },
  },
  prettier,
]);

export const nextjsConfig = defineConfig([
  ...commonConfig,
  ...nextVitals,
  {
    files: sourceFiles,
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    name: 'vavito/nextjs',
    rules: {
      'no-restricted-imports': restrictedImports(
        appBoundaryPatterns.api,
        'O frontend não pode importar arquivos da API.',
      ),
    },
  },
  prettier,
]);

export const libraryConfig = defineConfig([
  ...commonConfig,
  {
    files: sourceFiles,
    languageOptions: { globals: globals.node },
    name: 'vavito/library',
    rules: {
      'no-restricted-imports': restrictedImports(
        [...appBoundaryPatterns.api, ...appBoundaryPatterns.web],
        'Pacotes compartilhados não podem importar aplicações.',
      ),
    },
  },
  prettier,
]);

export const nodeConfig = defineConfig([
  ...commonConfig,
  {
    files: sourceFiles,
    languageOptions: { globals: globals.node },
    name: 'vavito/node',
  },
  prettier,
]);
