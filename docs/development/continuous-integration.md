# Integração contínua

O workflow `.github/workflows/quality.yml` executa a qualidade do monorepo em pull requests e em pushes para `main`.

## Checks

- `Quality / API`: formatação, lint, typecheck, testes e build da API e de suas dependências internas.
- `Quality / Web`: formatação, lint, typecheck, testes disponíveis e build do frontend e de suas dependências internas.

Cada job usa Node.js 24.18.0 e a versão do pnpm declarada em `packageManager`, instala o monorepo pela raiz com `pnpm install --frozen-lockfile` e mantém caches separados do pnpm e do Turborepo.

Os testes atuais não dependem de PostgreSQL. Um serviço de banco deve ser adicionado somente ao job da API quando surgirem testes de integração que precisem dele, evitando custo e tempo desnecessários nos demais checks.

## Proteção da branch principal

Depois que o workflow executar ao menos uma vez no GitHub, configure uma ruleset para a branch `main`:

1. Abra **Settings → Rules → Rulesets** no repositório.
2. Crie ou edite a ruleset da branch `main`.
3. Exija pull request antes do merge.
4. Ative a exigência de status checks.
5. Selecione `Quality / API` e `Quality / Web` como checks obrigatórios.

Essa configuração no GitHub é necessária para impedir o merge de uma pull request quando qualquer um dos dois checks falhar.
