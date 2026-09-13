# Regressão do backend

A regressão da API reúne os testes unitários, HTTP e de integração antes de uma versão candidata. O processo impede redução silenciosa de cobertura, testes ignorados e acesso acidental a bancos remotos.

## Gates obrigatórios

| Gate                 | Regra                                                                 |
| -------------------- | --------------------------------------------------------------------- |
| Statements           | mínimo global de 85%                                                   |
| Branches             | mínimo global de 70%                                                   |
| Functions            | mínimo global de 80%                                                   |
| Lines                | mínimo global de 85%                                                   |
| Testes ignorados     | nenhum `.skip`, `.todo`, `xit`, `xtest` ou equivalente executado      |
| Banco de integração  | host local e database `vavito_integration`                             |
| Serviços externos    | fakes e stubs nas suítes regulares; nenhuma chamada ao Supabase/Resend |

A medição inicial da Task 8.6, considerando todo `apps/api/src` exceto código gerado e o bootstrap de `main.ts`, registrou:

| Métrica    | Resultado inicial |
| ---------- | ----------------- |
| Statements | 89,54%            |
| Branches   | 72,40%            |
| Functions  | 86,94%            |
| Lines      | 89,79%            |

Os limites ficam abaixo da linha de base para absorver pequenas variações de instrumentação, mas falham antes de uma regressão material. A cobertura é recalculada pela suíte regular, que inclui testes unitários e E2E da API.

## Comandos

Executar testes unitários e E2E com cobertura:

```bash
pnpm --filter @vavito/api test:coverage
```

Com o banco isolado já preparado, executar toda a regressão:

```bash
pnpm test:regression:api
```

O segundo comando executa primeiro a cobertura e depois todos os testes de integração. O processador configurado no Jest encerra ambas as suítes com erro se algum teste estiver ignorado ou marcado como pendente.

## Execução local no PowerShell

O helper solicita a senha sem exibi-la, cria `vavito_integration` quando necessário, prepara o fixture mínimo de `auth.users`, aplica as migrations e executa a regressão:

```powershell
& ./apps/api/test/helpers/run-local-regression.ps1
```

Pré-requisitos:

- PostgreSQL local escutando na porta `5432`;
- `psql` e `createdb` disponíveis no `PATH`;
- usuário local `postgres`, ou parâmetros alternativos informados ao script.

Exemplo para outra porta ou usuário:

```powershell
& ./apps/api/test/helpers/run-local-regression.ps1 `
  -PostgresPort 5433 `
  -PostgresUser vavito
```

O script recusa hosts diferentes de `localhost`, `127.0.0.1` e `::1`. As variáveis com a senha e as URLs são removidas da sessão ao final, inclusive quando um comando falha.

## Integração contínua

O job `Quality / API` usa um container PostgreSQL descartável, prepara o schema mínimo do Supabase Auth, aplica todas as migrations e executa a mesma regressão. Depois valida lint, tipos e build da API e de suas dependências internas.

Nenhum teste de integração pode usar `DATABASE_URL`, `DIRECT_URL` ou `INTEGRATION_DATABASE_URL` de staging ou produção. A proteção em `test/helpers/database-url.ts` recusa hosts remotos e qualquer database diferente de `vavito_integration`.

## Versão candidata

A tag histórica `v0.1.0-rc.1` identifica a regressão aprovada da API na Sprint 8 e não deve ser
movida. O congelamento do produto completo, os gates adicionais e a criação da próxima tag estão
documentados no [runbook da release candidate](release-candidate.md).

Nenhuma tag deve ser criada sobre um worktree sujo ou antes da aprovação dos commits e das
validações da release.
