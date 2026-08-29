# Cliente tipado da API

`packages/api-client` é a fronteira HTTP compartilhada entre o frontend e a API NestJS. O package não depende de React, Next.js ou código interno das aplicações.

## Fonte do contrato

O fluxo mantém uma única fonte técnica para rotas, parâmetros, corpos e respostas:

```text
controllers e DTOs da API
  → packages/api-client/openapi/openapi.json
  → packages/api-client/src/generated/schema.ts
  → clientes consumidos por apps/web
```

`src/generated/schema.ts` é produzido por `openapi-typescript` e não deve ser editado manualmente. Quando o contrato da API mudar, execute na raiz:

```bash
pnpm openapi:export
pnpm api-client:generate
```

O primeiro comando exporta o documento OpenAPI versionado. O segundo atualiza os tipos TypeScript. `pnpm api-client:check` compara o resultado esperado com o arquivo atual sem modificá-lo e falha quando eles divergem.

## Estrutura

```text
packages/api-client/
├── openapi/openapi.json
├── scripts/generate-openapi.mjs
├── src/
│   ├── generated/schema.ts
│   ├── client/
│   ├── errors/
│   └── index.ts
└── test/client/
```

O cliente usa `openapi-fetch`, preservando nos métodos `GET`, `POST`, `PATCH`, `PUT` e `DELETE` os caminhos e contratos inferidos do OpenAPI.

## Clientes público e autenticado

`createPublicApiClient` executa chamadas sem incluir credenciais. `createAuthenticatedApiClient` exige um `getAccessToken` e consulta o provider imediatamente antes de cada requisição. Isso permite que a integração de sessão atualize ou renove o token sem recriar o cliente.

```ts
import { createAuthenticatedApiClient, createPublicApiClient } from '@vavito/api-client';

const publicApi = createPublicApiClient({ baseUrl });
const authenticatedApi = createAuthenticatedApiClient({
  baseUrl,
  getAccessToken: () => session.accessToken,
});
```

O cliente autenticado rejeita a chamada antes do `fetch` quando não existe access token. Tokens, cookies ou regras do Supabase não são armazenados pelo package.

## Base URL por ambiente

O frontend lê `NEXT_PUBLIC_API_URL` em `apps/web/src/lib/env/public-env.ts`. Por ser pública, essa variável contém apenas a origem da API, sem JWT, chave ou credencial.

Em desenvolvimento, `apps/web/.env.example` aponta para `http://localhost:3001`. Preview e produção devem configurar a URL HTTPS correspondente durante o build do Next.js. A ausência da variável em produção gera erro quando o cliente é criado, evitando chamadas silenciosas para o ambiente local.

`apps/web/src/lib/api/api-client.ts` adapta a configuração do Next.js às fábricas independentes do package. Features e rotas do frontend devem consumir esse adaptador ou receber um `ApiClient`; não devem recriar wrappers de `fetch`.

## Erros

Respostas HTTP sem sucesso são convertidas em `ApiClientError`, preservando `code`, `message`, `details`, `statusCode`, `path`, `requestId` e `timestamp` quando o contrato global da API os fornece. Respostas fora do contrato recebem um código HTTP seguro, e falhas de transporte usam `NETWORK_ERROR` sem expor detalhes internos na mensagem.

## CI

O job `Quality / Web` executa `pnpm api-client:check` antes de lint, typecheck, testes e builds. O job da API valida separadamente se `openapi/openapi.json` corresponde ao documento servido. Em conjunto, as duas verificações cobrem a sequência completa do controller até o tipo consumido pelo frontend.
