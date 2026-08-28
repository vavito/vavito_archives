# Demonstração local da API

Este guia executa um fluxo verificável da API do Vavito Archives sem depender do frontend. A coleção cobre disponibilidade, login, perfil, publicação de artigo, leitura pública, comentários, reactions, bookmarks, contato e newsletter.

## Pré-requisitos do fluxo completo

- API em execução em `http://localhost:3001`;
- migrations aplicadas no PostgreSQL do projeto Supabase;
- usuário confirmado no Supabase Auth;
- `Profile` desse usuário com role `ADMIN` para o fluxo editorial;
- URL e publishable key do Supabase;
- Resend configurado apenas para testar contato, confirmação de newsletter e campanhas.

A `service_role`, a URL do banco e a API key do Resend pertencem somente ao `.env` da API. A coleção usa apenas a publishable key do Supabase para autenticar o usuário e nunca deve receber credenciais de servidor.

## Preparar a API

Na raiz do monorepo:

```bash
corepack enable
corepack install
pnpm install
```

Crie o arquivo de ambiente:

```bash
cp .env.example .env
```

No PowerShell:

```powershell
Copy-Item .env.example .env
```

Preencha os placeholders do `.env` conforme os guias de [banco de dados](database.md), [Supabase Auth](supabase-auth.md), [Storage](media-storage.md) e [Resend](resend-email.md). Depois, aplique as migrations:

```bash
pnpm --filter @vavito/api prisma:migrate:deploy
```

Para executar rotas administrativas, crie e confirme um usuário no Supabase Auth, informe seu UUID em `ADMIN_USER_ID` e execute:

```bash
pnpm --filter @vavito/api prisma:seed
```

Inicie somente a API:

```bash
pnpm dev:api
```

Confirme que o processo e o PostgreSQL estão disponíveis:

```bash
curl http://localhost:3001/api/v1/health
curl http://localhost:3001/api/v1/health/ready
```

No PowerShell, use `curl.exe` se `curl` estiver associado a outro comando.

## Executar pelo Postman

Importe os dois arquivos:

- [`vavito-archives.postman_collection.json`](postman/vavito-archives.postman_collection.json);
- [`vavito-archives.postman_environment.json`](postman/vavito-archives.postman_environment.json).

Selecione o ambiente **Vavito Archives - Local** e preencha:

| Variável                 | Valor                                                                 |
| ------------------------ | --------------------------------------------------------------------- |
| `baseUrl`                | URL local da API, normalmente `http://localhost:3001`                 |
| `supabaseUrl`            | Project URL exibida pelo Supabase                                     |
| `supabasePublishableKey` | Publishable key; nunca use a `service_role`                            |
| `adminEmail`             | Email confirmado do usuário administrador                             |
| `adminPassword`          | Senha desse usuário; mantenha apenas no ambiente local do Postman     |
| `newsletterEmail`        | Email ao qual você tem acesso para confirmar e cancelar uma inscrição |

Execute as pastas na sequência abaixo:

1. **00 - Sistema** valida liveness e readiness.
2. **01 - Autenticação** obtém o JWT e salva `accessToken` automaticamente.
3. **03 - Fluxo editorial** cria, completa e publica um artigo; `postId` e `postSlug` são capturados.
4. **02 - Conteúdo público** consulta o artigo e registra uma visualização.
5. **04 - Engajamento autenticado** comenta, reage e salva um bookmark.
6. **05 - Comunicação** testa contato e inicia o double opt-in da newsletter.
7. **06 - Campanha opcional** exige assinante confirmado e Resend funcional.

As variáveis dinâmicas ficam somente na memória da coleção. Para repetir o envio de campanha como uma nova operação, limpe `idempotencyKey` nas variáveis da coleção antes de executar novamente.

O contrato completo possui mais endpoints que o fluxo demonstrável. Importe também [`packages/api-client/openapi/openapi.json`](../../packages/api-client/openapi/openapi.json) no Postman para gerar uma coleção com todas as operações.

## Executar com curl

Substitua os valores entre `<...>`. Os exemplos abaixo usam `curl`; no PowerShell, prefira `curl.exe`.

### Entrar pelo Supabase

```bash
curl -X POST "<SUPABASE_URL>/auth/v1/token?grant_type=password" \
  -H "apikey: <SUPABASE_PUBLISHABLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"email":"<EMAIL>","password":"<SENHA>"}'
```

Copie o campo `access_token` da resposta para `<JWT>` nos próximos comandos.

### Consultar o perfil autenticado

```bash
curl http://localhost:3001/api/v1/profiles/me \
  -H "Authorization: Bearer <JWT>"
```

### Criar um rascunho administrativo

```bash
curl -X POST http://localhost:3001/api/v1/admin/posts \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Artigo demonstrável do Vavito","slug":"artigo-demonstravel-vavito"}'
```

Copie o `id` da resposta para `<POST_ID>`.

### Completar e publicar o artigo

```bash
curl -X PATCH http://localhost:3001/api/v1/admin/posts/<POST_ID> \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"excerpt":"Fluxo demonstrável da API.","content":{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Artigo criado por curl."}]}]},"contentSchemaVersion":1,"tagNames":["Demonstração","API"]}'

curl -X POST http://localhost:3001/api/v1/admin/posts/<POST_ID>/publish \
  -H "Authorization: Bearer <JWT>"
```

### Consultar e comentar no artigo

```bash
curl http://localhost:3001/api/v1/posts/artigo-demonstravel-vavito

curl -X POST http://localhost:3001/api/v1/posts/artigo-demonstravel-vavito/comments \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"content":"Comentário criado pelo fluxo demonstrável."}'
```

## Resultados esperados

- liveness e readiness retornam `200`;
- login retorna um access token válido;
- perfil autenticado retorna `200`;
- rascunho retorna `201` e pode ser publicado depois de receber conteúdo e resumo;
- artigo publicado fica disponível pela rota pública;
- comentário, reaction e bookmark ficam associados ao usuário autenticado;
- contato e newsletter persistem antes da tentativa de envio pelo Resend.

Erros seguem o contrato global com `code`, `message`, `statusCode`, `path`, `requestId` e `timestamp`. Consulte o [Swagger/OpenAPI](openapi.md) para todos os DTOs e respostas.

## Testes automatizados

O comando abaixo executa formatação, lint, typecheck, testes e builds do monorepo:

```bash
pnpm check
```

Para executar apenas a suíte regular da API:

```bash
pnpm --filter @vavito/api test
```

Os testes de integração exigem um PostgreSQL local isolado chamado `vavito_integration`; nunca use o Supabase remoto. O procedimento completo está em [Integração contínua](continuous-integration.md#checks).
