# Vavito Archives

Monorepo do Vavito Archives, composto pela API NestJS, pela aplicação web Next.js e por pacotes compartilhados.

## Requisitos

- Node.js 24 LTS (a versão recomendada está em `.nvmrc` e `.node-version`)
- Corepack habilitado

## Instalação

```bash
corepack enable
corepack install
pnpm install
```

O projeto usa um único `pnpm-lock.yaml`, mantido na raiz.

Crie o arquivo local de ambiente antes de iniciar a API:

```bash
cp .env.example .env
```

No PowerShell, use `Copy-Item .env.example .env`. O arquivo `.env` não deve ser versionado e os placeholders devem ser substituídos por credenciais reais apenas no ambiente apropriado.

## Comandos principais

```bash
pnpm dev        # inicia API e web em modo de desenvolvimento
pnpm build      # compila todos os workspaces que possuem build
pnpm lint       # executa o ESLint em todos os workspaces
pnpm lint:fix   # corrige automaticamente os problemas compatíveis
pnpm format     # formata os arquivos com Prettier
pnpm format:check # valida a formatação sem alterar arquivos
pnpm typecheck  # valida os tipos TypeScript
pnpm test       # executa os testes
pnpm check      # executa format check, lint, typecheck, test e build
```

Para executar apenas uma aplicação:

```bash
pnpm dev:api
pnpm dev:web
```

- Web: `http://localhost:3000`
- API: `http://localhost:3001`

## API e OpenAPI

As rotas da API usam o prefixo global `/api/v1`. Em desenvolvimento, os principais endereços são:

- Health: `http://localhost:3001/api/v1/health`
- Swagger UI: `http://localhost:3001/docs`
- Contrato OpenAPI JSON: `http://localhost:3001/openapi.json`

O Swagger é habilitado por padrão em desenvolvimento e teste. Em produção, permanece desabilitado por padrão e só é publicado quando `SWAGGER_ENABLED=true` for definido explicitamente no ambiente.

## Estrutura

```text
apps/
  api/          API NestJS
  web/          aplicação Next.js com App Router
packages/
  api-client/   cliente tipado da API (gerado em task futura)
  eslint-config/ configuração compartilhada do ESLint
  typescript-config/ configurações compartilhadas do TypeScript
  ui/           componentes compartilhados de interface
tests/
  e2e/          testes de ponta a ponta do monorepo
```

A documentação de produto e arquitetura está em `docs/product`.

## Qualidade e aliases

- `packages/eslint-config` centraliza as regras de ESLint para NestJS, Next.js, bibliotecas e testes Node.js.
- `packages/typescript-config` centraliza as configurações TypeScript base, NestJS, Next.js e bibliotecas.
- A API usa o alias `@api/*` para arquivos de `apps/api/src`.
- O frontend usa o alias `@web/*` para arquivos de `apps/web/src`.
- Uma aplicação não pode importar arquivos internos da outra; código compartilhado deve ficar em `packages`.
- As recomendações de ESLint e Prettier para o VS Code estão versionadas em `.vscode`.
