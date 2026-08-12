# Integração contínua

O workflow `.github/workflows/quality.yml` executa a qualidade do monorepo em pull requests e em pushes para `main`.

## Checks

- `Quality / API`: formatação, lint, typecheck, testes e build da API e de suas dependências internas.
- `Quality / Web`: formatação, lint, typecheck, testes disponíveis e build do frontend e de suas dependências internas.

Cada job usa Node.js 24.18.0 e a versão do pnpm declarada em `packageManager`, instala o monorepo pela raiz com `pnpm install --frozen-lockfile` e mantém caches separados do pnpm e do Turborepo.

O job da API sobe um service container PostgreSQL exclusivo, aguarda o `pg_isready`, aplica as migrations versionadas com `prisma migrate deploy` e executa a suíte `test:integration`. O job da Web não sobe banco.

O banco de integração usa apenas `localhost`, possui o nome fixo `vavito_integration` e é descartado com o runner ao final da execução. O teste também remove os registros temporários em um bloco `finally`. Uma proteção no código recusa hosts remotos, inclusive URLs do Supabase, e recusa qualquer outro nome de banco.

Para executar a suíte fora da CI, disponibilize um PostgreSQL local com o banco `vavito_integration`, aplique as migrations e informe a URL dedicada:

```bash
DIRECT_URL=postgresql://postgres:postgres@localhost:5432/vavito_integration corepack pnpm --filter @vavito/api prisma:migrate:deploy
INTEGRATION_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vavito_integration corepack pnpm --filter @vavito/api test:integration
```

Nunca reutilize `DATABASE_URL`, `DIRECT_URL` ou `INTEGRATION_DATABASE_URL` de staging ou produção nesses comandos.

## Proteção da branch principal

Depois que o workflow executar ao menos uma vez no GitHub, configure uma ruleset para a branch `main`:

1. Abra **Settings → Rules → Rulesets** no repositório.
2. Crie ou edite a ruleset da branch `main`.
3. Exija pull request antes do merge.
4. Ative a exigência de status checks.
5. Selecione `Quality / API` e `Quality / Web` como checks obrigatórios.

Essa configuração no GitHub é necessária para impedir o merge de uma pull request quando qualquer um dos dois checks falhar.
