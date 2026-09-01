# Integração contínua

O workflow `.github/workflows/quality.yml` executa a qualidade do monorepo em pull requests e em pushes para `main`.

## Checks

- `Quality / API`: formatação, regressão com cobertura, lint, typecheck e build da API e de suas dependências internas.
- `Quality / Web`: formatação, sincronização do cliente OpenAPI, testes de componente e integração, fluxos públicos Playwright, lint, typecheck e build do frontend e de suas dependências internas.

Cada job usa Node.js 24.18.0 e a versão do pnpm declarada em `packageManager`, instala o monorepo pela raiz com `pnpm install --frozen-lockfile` e mantém caches separados do pnpm e do Turborepo.

O job da API sobe um service container PostgreSQL exclusivo, aguarda o `pg_isready`, prepara um fixture mínimo de `auth.users`, aplica as migrations versionadas com `prisma migrate deploy` e executa `test:regression:api`. A regressão cobre testes unitários, E2E, cobertura mínima, ausência de testes ignorados e toda a suíte de integração. O job da Web não sobe banco: ele executa o Vitest com jsdom e Testing Library e os fluxos públicos Playwright antes do lint, typecheck e build de produção compatível com a Vercel.

Os testes do frontend ficam em `apps/web/test`, separados por nível (`component` e `integration`) e por módulo. O setup compartilhado da Testing Library fica em `apps/web/test/helpers`. Para executar apenas essa suíte pela raiz:

```bash
pnpm test:web
```

O comando equivalente usado pela CI é `pnpm turbo run test --filter=@vavito/web...`. O sufixo `...` inclui as dependências internas do workspace Web, enquanto o cache persistido em `.turbo` evita repetir tarefas cujo conteúdo não mudou.

Os fluxos completos das páginas públicas ficam em `tests/e2e/public` e executam a aplicação em tamanhos desktop e mobile. Uma API local controlada fornece os fixtures de posts e tags; portanto, a suíte não acessa banco, Supabase, API publicada nem credenciais. Ela cobre a navegação entre Home, listagem e leitura, a busca global, o feedback de indisponibilidade e a convivência entre rodapé e navegação móvel.

Na primeira execução local, instale o Chromium administrado pelo Playwright e depois rode a suíte pela raiz:

```bash
pnpm --filter @vavito/e2e exec playwright install chromium
pnpm test:e2e:public
```

O Playwright inicia e encerra automaticamente a API controlada na porta `4100` e o Next.js na porta `3100`, sem ocupar as portas padrão usadas no desenvolvimento.

O fixture existe apenas porque o PostgreSQL puro da CI não inclui o schema gerenciado pelo Supabase Auth. Ele contém somente as colunas consumidas pelo trigger de criação de `Profile`, é protegido pela mesma validação de URL local da suíte e nunca é aplicado ao Supabase.

O banco de integração usa apenas `localhost`, possui o nome fixo `vavito_integration` e é descartado com o runner ao final da execução. O teste também remove os registros temporários em um bloco `finally`. Uma proteção no código recusa hosts remotos, inclusive URLs do Supabase, e recusa qualquer outro nome de banco.

Para executar a suíte fora da CI, disponibilize um PostgreSQL local com o banco `vavito_integration`, aplique as migrations e informe a URL dedicada:

```bash
INTEGRATION_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vavito_integration corepack pnpm --filter @vavito/api test:integration:prepare
DIRECT_URL=postgresql://postgres:postgres@localhost:5432/vavito_integration corepack pnpm --filter @vavito/api prisma:migrate:deploy
INTEGRATION_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vavito_integration corepack pnpm --filter @vavito/api test:integration
```

Nunca reutilize `DATABASE_URL`, `DIRECT_URL` ou `INTEGRATION_DATABASE_URL` de staging ou produção nesses comandos.

O procedimento unificado, os pisos de cobertura e o helper seguro para PowerShell estão em `docs/development/backend-regression.md`.

## Proteção da branch principal

Depois que o workflow executar ao menos uma vez no GitHub, configure uma ruleset para a branch `main`:

1. Abra **Settings → Rules → Rulesets** no repositório.
2. Crie ou edite a ruleset da branch `main`.
3. Exija pull request antes do merge.
4. Ative a exigência de status checks.
5. Selecione `Quality / API` e `Quality / Web` como checks obrigatórios.

Essa configuração no GitHub é necessária para impedir o merge de uma pull request quando qualquer um dos dois checks falhar.
