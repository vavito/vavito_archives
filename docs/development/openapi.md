# OpenAPI da API

O contrato OpenAPI é a fonte técnica para a geração de tipos e do cliente HTTP em `packages/api-client`. A mesma fábrica de documento atende quatro consumidores:

- Swagger UI em `/docs`;
- JSON servido em `/openapi.json`;
- teste global de regressão do contrato;
- artefato versionado `packages/api-client/openapi/openapi.json`.

Essa centralização impede que a interface interativa e o arquivo usado pelo frontend descrevam contratos diferentes.

## Disponibilidade

Em desenvolvimento e teste, o Swagger é habilitado por padrão. Em produção, permanece desabilitado, salvo quando `SWAGGER_ENABLED=true` for configurado explicitamente. A exportação em arquivo não depende dessa flag e não publica um servidor HTTP.

## Exportação

Na raiz do monorepo, execute:

```bash
pnpm openapi:export
```

O comando compila a API, monta apenas o grafo necessário para inspecionar controllers e grava o JSON formatado em `packages/api-client/openapi/openapi.json`. Ele não chama `app.init()`, não abre porta e não conecta ao PostgreSQL. A validação de ambiente da API continua ativa, portanto as variáveis locais obrigatórias precisam existir, mas seus valores não são incluídos no documento.

Execute novamente o comando sempre que uma rota, DTO, exemplo, status HTTP, tag ou regra de autenticação mudar. O artefato é rastreado pelo Git para que a Task 9.5 possa gerar tipos de forma reprodutível.

## Convenções

- `operationId` segue `<controller>_<método>` e deve ser único no documento.
- Toda operação possui uma tag declarada e um resumo.
- Rotas protegidas declaram o esquema `supabase-jwt` e respostas `401` e `403`.
- Toda operação declara a resposta segura `500` com `ErrorResponseDto`.
- Respostas de erro já declaradas recebem schema e exemplo padronizados quando o controller não fornece um corpo mais específico.
- Todas as respostas documentam o header `X-Request-Id` usado na correlação dos logs.
- Parâmetros, requests JSON, multipart e responses com corpo possuem exemplos seguros; campos de arquivo usam `format: binary`.
- Exemplos nunca contêm tokens, emails reais, credenciais, URLs privadas ou respostas brutas de provedores.

## Teste de regressão

O teste `apps/api/test/e2e/openapi/openapi-contract.e2e-spec.ts` verifica automaticamente:

- ausência de `operationId` duplicado;
- tags e resumos em todas as operações;
- autenticação e respostas de erro comuns;
- schemas e exemplos de parâmetros, requests e responses;
- alinhamento integral entre `/openapi.json` e o artefato versionado, desconsiderando apenas a versão configurada para o ambiente de teste.

Se o teste acusar divergência após uma alteração legítima do contrato, revise o documento gerado e execute `pnpm openapi:export` antes de criar o commit.

## Cliente tipado

O artefato versionado alimenta o codegen de `packages/api-client`. Depois de atualizar o contrato, execute `pnpm api-client:generate` e revise tanto o JSON quanto o schema TypeScript gerado. A estrutura do cliente, sua integração com o frontend e a verificação da CI estão documentadas em [`api-client.md`](api-client.md).
