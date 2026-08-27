# Vavito Archives — Contrato inicial da API V1

Status: **aprovado**

Este documento define o contrato HTTP inicial compartilhado entre `apps/api`, `apps/web` e `packages/api-client`. Ele consolida o escopo funcional, as regras de domínio e o inventário de endpoints do plano.

## Convenções gerais

- API REST em JSON sobre HTTPS.
- Prefixo global: `/api/v1`.
- Swagger/OpenAPI disponível apenas conforme configuração do ambiente; o documento OpenAPI gerado pela API será a fonte técnica para `packages/api-client`.
- Identificadores internos usam UUID.
- Datas usam ISO 8601 em UTC, por exemplo `2026-07-30T20:15:00.000Z`.
- Campos desconhecidos em requests são rejeitados.
- Strings são normalizadas antes da validação; conteúdo textual vazio após `trim` é inválido.
- Requests e responses usam `camelCase`.
- Recursos únicos são retornados diretamente, sem envelope `data`.
- Exclusões e operações sem corpo retornam `204 No Content`.
- Rotas públicas nunca revelam rascunhos, conteúdo arquivado, emails, tokens ou dados administrativos.

## Autenticação e autorização

### Bearer token

Rotas autenticadas recebem:

```http
Authorization: Bearer <supabase_access_token>
```

A API valida assinatura, issuer, audience e expiração do JWT do Supabase. A autorização usa a função persistida no `Profile`, e não metadados editáveis pelo cliente.

### Níveis de acesso

| Nível | Regra |
| --- | --- |
| `Público` | Não exige JWT. |
| `Público limitado` | Não exige JWT, mas aplica rate limit e controles antiabuso. |
| `Autenticado` | Exige JWT válido e `Profile` ativo. |
| `Autor` | Exige JWT e propriedade do recurso; `ADMIN` pode intervir quando a regra permitir. |
| `ADMIN` | Exige JWT e `Profile.role = ADMIN`. |
| `Assinatura Resend` | Exige verificação criptográfica do webhook; não usa JWT do usuário. |

Ausência ou invalidade do JWT retorna `401`. Usuário autenticado sem permissão retorna `403`.

## Headers relevantes

| Header | Uso |
| --- | --- |
| `Authorization` | Bearer token nas rotas autenticadas. |
| `Content-Type: application/json` | Requests JSON. |
| `Content-Type: multipart/form-data` | Uploads de avatar e mídia editorial. |
| `Idempotency-Key` | Obrigatório ao disparar campanha; UUID gerado pelo cliente administrativo. |
| `X-Request-Id` | Aceito quando válido; caso ausente, gerado pela API e devolvido na resposta. |
| `svix-id`, `svix-timestamp`, `svix-signature` | Validados conforme o SDK oficial no endpoint de webhook do Resend. |

## Paginação, filtros e ordenação

### Limites por contexto

| Contexto | Página inicial | Itens padrão | Máximo aceito |
| --- | --- | --- | --- |
| Artigos públicos e bookmarks | `1` | `12` | `24` |
| Comentários principais | `1` | `20` | `50` |
| Listagens administrativas | `1` | `20` | `100` |
| Busca instantânea | não paginada | até `8` | `8`, fixo pela API |

O parâmetro `page` possui mínimo `1`. O parâmetro `limit` existe apenas nas listagens paginadas. Esses máximos são proteções da API; a interface pode usar valores menores e não precisa oferecer ao usuário um seletor de quantidade. A busca recebe somente `q` e devolve no máximo oito resultados.

### Resposta paginada

```json
{
  "items": [],
  "meta": {
    "page": 1,
    "limit": 12,
    "total": 0,
    "totalPages": 0
  }
}
```

Regras:

- ordenação sempre possui desempate por `id`;
- página além do total retorna `200` com `items: []`;
- `totalPages` é `0` quando `total` é `0`;
- filtros inválidos retornam `VALIDATION_ERROR`;
- comentários paginam apenas comentários principais; respostas diretas vêm aninhadas no item principal.

## Formato de erro

```json
{
  "statusCode": 400,
  "code": "VALIDATION_ERROR",
  "message": "Dados inválidos.",
  "details": [
    {
      "field": "email",
      "reason": "INVALID_EMAIL"
    }
  ],
  "timestamp": "2026-07-30T20:15:00.000Z",
  "path": "/api/v1/newsletter/subscriptions",
  "requestId": "019c..."
}
```

Regras:

- `code` é estável e pode orientar a interface;
- `message` é legível, mas não deve ser usada como identificador;
- `details` é `null` quando não há detalhes seguros;
- erros `5xx` não expõem stack, query, segredo ou resposta bruta de integração;
- rotas públicas respondem `POST_NOT_FOUND` tanto para post inexistente quanto não publicado.

### Mapeamento HTTP comum

| HTTP | Código | Uso |
| --- | --- | --- |
| `400` | `VALIDATION_ERROR` | DTO, query, arquivo ou parâmetro inválido. |
| `400` | `WEBHOOK_PAYLOAD_INVALID` | Payload assinado do webhook não atende ao contrato mínimo. |
| `401` | `UNAUTHENTICATED` | JWT ausente, expirado ou inválido. |
| `401` | `WEBHOOK_SIGNATURE_INVALID` | Assinatura do webhook inválida. |
| `403` | `FORBIDDEN` | Perfil sem autorização para a ação. |
| `404` | `*_NOT_FOUND` | Recurso inexistente ou indisponível para aquele ator. |
| `409` | código de domínio específico | Unicidade, estado ou concorrência incompatível. |
| `410` | `SUBSCRIBER_CONFIRMATION_TOKEN_EXPIRED` | Token de confirmação expirado. |
| `413` | `PAYLOAD_TOO_LARGE` | Corpo ou arquivo acima do limite. |
| `415` | `UNSUPPORTED_MEDIA_TYPE` | MIME real ou extensão não aceita. |
| `429` | `RATE_LIMIT_EXCEEDED` | Limite de uso excedido. |
| `500` | `INTERNAL_ERROR` | Falha inesperada sem detalhes internos. |
| `503` | `SERVICE_UNAVAILABLE` | Dependência essencial indisponível. |

Os códigos específicos definidos em `domain-rules-and-states.md` são preservados na API quando aplicáveis.

## DTOs compartilhados

### Tipos básicos

```ts
type UUID = string;
type ISODateTime = string;
type PostStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
type CommentStatus = "VISIBLE" | "HIDDEN" | "SPAM" | "DELETED";
type ReactionType = "LIKE" | "DISLIKE";
type SubscriberStatus =
  | "PENDING"
  | "CONFIRMED"
  | "UNSUBSCRIBED"
  | "BOUNCED"
  | "COMPLAINED";
type CampaignStatus = "DRAFT" | "SENDING" | "SENT" | "FAILED";
```

### Profile

```ts
interface ProfileResponseDto {
  id: UUID;
  displayName: string;
  avatarUrl: string | null;
  role: "USER" | "ADMIN";
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

interface UpdateProfileDto {
  displayName?: string;
}

interface DeleteAccountDto {
  confirmation: "EXCLUIR MINHA CONTA";
}
```

O email e a senha pertencem ao Supabase Auth e não são alterados por `UpdateProfileDto`.

### Post

```ts
interface TagResponseDto {
  id: UUID;
  name: string;
  slug: string;
  publishedPostCount?: number;
}

interface PostSummaryDto {
  id: UUID;
  slug: string;
  title: string;
  excerpt: string;
  coverUrl: string | null;
  coverAlt: string | null;
  tags: TagResponseDto[];
  publishedAt: ISODateTime;
  readingTimeMinutes: number;
  viewCount: number;
}

interface PostDetailResponseDto extends PostSummaryDto {
  content: Record<string, unknown>;
  contentSchemaVersion: number;
  seoTitle: string | null;
  seoDescription: string | null;
  reactionCounts: { like: number; dislike: number };
  viewer: {
    reaction: ReactionType | null;
    bookmarked: boolean;
  } | null;
}

interface CreatePostDto {
  title?: string;
  slug?: string;
}

interface UpdatePostDto {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: Record<string, unknown>;
  contentSchemaVersion?: number;
  tagNames?: string[];
  coverMediaId?: UUID | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
}
```

`PostAdminDetailDto` acrescenta `status`, `author`, datas administrativas e dados do editor. Edição de post publicado cria revisão com snapshot anterior, autor e data; esse histórico não aparece em `PostDetailResponseDto`.

Tags são normalizadas e associadas a partir de `tagNames`. A V1 não exige CRUD administrativo separado para tags.

### Comment

```ts
interface CommentAuthorDto {
  id: UUID;
  displayName: string;
  avatarUrl: string | null;
}

interface CommentResponseDto {
  id: UUID;
  postId: UUID;
  parentId: UUID | null;
  content: string | null;
  status: "VISIBLE" | "DELETED";
  author: CommentAuthorDto | null;
  edited: boolean;
  createdAt: ISODateTime;
  editedAt: ISODateTime | null;
  replies: CommentResponseDto[];
}

interface CreateCommentDto {
  content: string;
  parentId?: UUID;
}

interface UpdateCommentDto {
  content: string;
}

interface ModerateCommentDto {
  status: "VISIBLE" | "HIDDEN" | "SPAM";
  reason?: string;
}
```

Comentários válidos são criados como `VISIBLE`. `DELETED` pode aparecer publicamente apenas como placeholder para preservar respostas. A resposta não pode ter filhos.

### Engagement

```ts
interface SetReactionDto {
  type: ReactionType;
}

interface ReactionResponseDto {
  reaction: ReactionType | null;
  counts: { like: number; dislike: number };
}
```

### Media

```ts
interface MediaResponseDto {
  id: UUID;
  url: string;
  path: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  altText: string;
  status: "UPLOADING" | "READY" | "FAILED" | "ORPHANED";
  createdAt: ISODateTime;
}

interface UpdateMediaDto {
  altText?: string;
}
```

### Newsletter

```ts
interface SubscribeNewsletterDto {
  email: string;
  consent: true;
  source: "HOME" | "ARTICLE" | "FOOTER";
}

interface ConfirmSubscriptionDto {
  token: string;
}

interface UnsubscribeDto {
  token: string;
}

interface SubscriberAdminDto {
  id: UUID;
  email: string;
  status: SubscriberStatus;
  consentedAt: ISODateTime;
  confirmedAt: ISODateTime | null;
  unsubscribedAt: ISODateTime | null;
  bouncedAt: ISODateTime | null;
  complainedAt: ISODateTime | null;
}

interface CreateCampaignDto {
  postId: UUID;
  subject: string;
  previewText?: string;
}

interface UpdateCampaignDto {
  subject?: string;
  previewText?: string;
  html?: string;
}
```

`EmailCampaignAdminDto` inclui `id`, post resumido, snapshot, assunto, preview, status, tamanho da audiência, identificador do Resend, motivo de falha e datas.

Ao editar `html`, o marcador `{{unsubscribeUrl}}` é obrigatório. A API preserva esse marcador no preview e o substitui pelo link individual somente durante o envio.

### Contact

```ts
interface CreateContactMessageDto {
  name: string; // 2..120, normalizado
  email: string; // email válido, até 320, normalizado
  subject?: string; // 1..255; padrão "Contato pelo site"
  message: string; // 10..5000
}
```

## Endpoints

Todos os caminhos abaixo recebem automaticamente o prefixo `/api/v1`.

### Health

| Método | Caminho | Acesso | Request | Sucesso |
| --- | --- | --- | --- | --- |
| `GET` | `/health` | Público | — | `200` com `status`, `version` e `timestamp`. |
| `GET` | `/health/ready` | Monitor | — | `200` quando dependências essenciais respondem; `503` caso contrário, sem detalhes sensíveis. |

### Profiles

| Método | Caminho | Acesso | Request | Sucesso |
| --- | --- | --- | --- | --- |
| `GET` | `/profiles/me` | Autenticado | — | `200 ProfileResponseDto`. |
| `PATCH` | `/profiles/me` | Autenticado | `UpdateProfileDto` | `200 ProfileResponseDto`. |
| `PUT` | `/profiles/me/avatar` | Autenticado | multipart `file` | `200 ProfileResponseDto`. |
| `DELETE` | `/profiles/me/avatar` | Autenticado | — | `204`. |
| `DELETE` | `/profiles/me` | Autenticado | `DeleteAccountDto` | `204`. |

### Posts e tags — público

| Método | Caminho | Acesso | Request | Sucesso |
| --- | --- | --- | --- | --- |
| `GET` | `/posts` | Público | `page`, `limit`, `tag`, `sort=recent\|popular` | `200 Paginated<PostSummaryDto>`. |
| `GET` | `/posts/search` | Público limitado | `q` | `200 PostSummaryDto[]` com até 8 itens. |
| `GET` | `/posts/:slug` | Público | slug | `200 PostDetailResponseDto`. |
| `POST` | `/posts/:slug/views` | Público limitado | sinal técnico não identificador | `202`; não bloqueia a leitura. |
| `GET` | `/tags` | Público | — | `200 TagResponseDto[]`. |

### Posts — administração

| Método | Caminho | Acesso | Request | Sucesso |
| --- | --- | --- | --- | --- |
| `GET` | `/admin/posts` | ADMIN | `status`, `q`, `page`, `limit` | `200 Paginated<PostAdminSummaryDto>`. |
| `GET` | `/admin/posts/:id` | ADMIN | UUID | `200 PostAdminDetailDto`. |
| `POST` | `/admin/posts` | ADMIN | `CreatePostDto` | `201 PostAdminDetailDto`. |
| `PATCH` | `/admin/posts/:id` | ADMIN | `UpdatePostDto` | `200 PostAdminDetailDto`; também permite edição publicada com revisão. |
| `GET` | `/admin/posts/:id/revisions` | ADMIN | `page`, `limit` | `200 Paginated<PostRevisionAdminDto>`. |
| `POST` | `/admin/posts/:id/publish` | ADMIN | — | `200 PostAdminDetailDto`. |
| `POST` | `/admin/posts/:id/unpublish` | ADMIN | — | `200 PostAdminDetailDto`. |
| `POST` | `/admin/posts/:id/archive` | ADMIN | — | `200 PostAdminDetailDto`. |
| `POST` | `/admin/posts/:id/restore` | ADMIN | — | `200 PostAdminDetailDto` em `DRAFT`. |
| `DELETE` | `/admin/posts/:id` | ADMIN | confirmação explícita | `204` quando a exclusão permanente for permitida. |

O preview protegido é montado pelo frontend com `GET /admin/posts/:id`; não exige endpoint público adicional.

### Media editorial

| Método | Caminho | Acesso | Request | Sucesso |
| --- | --- | --- | --- | --- |
| `GET` | `/admin/media` | ADMIN | `status`, `page`, `limit` | `200 Paginated<MediaResponseDto>`. |
| `POST` | `/admin/media` | ADMIN | multipart `file`, `altText` | `201 MediaResponseDto`. |
| `PATCH` | `/admin/media/:id` | ADMIN | `UpdateMediaDto` | `200 MediaResponseDto`. |
| `DELETE` | `/admin/media/:id` | ADMIN | — | `204`; `409` se referenciada. |

### Comments

| Método | Caminho | Acesso | Request | Sucesso |
| --- | --- | --- | --- | --- |
| `GET` | `/posts/:slug/comments` | Público | `page`, `limit` | `200 Paginated<CommentResponseDto>` com respostas aninhadas. |
| `POST` | `/posts/:slug/comments` | Autenticado | `CreateCommentDto` | `201 CommentResponseDto` já `VISIBLE`. |
| `PATCH` | `/comments/:id` | Autor | `UpdateCommentDto` | `200 CommentResponseDto` com `edited = true`. |
| `DELETE` | `/comments/:id` | Autor ou ADMIN | — | `204`, com soft delete. |
| `GET` | `/admin/comments` | ADMIN | `status`, `postId`, `page`, `limit` | `200 Paginated<CommentAdminResponseDto>`. |
| `PATCH` | `/admin/comments/:id/status` | ADMIN | `ModerateCommentDto` | `200 CommentAdminResponseDto`. |

Após persistir um comentário, a API solicita email transacional ao administrador. Falha no email não desfaz o comentário.
A criação de comentários aplica inicialmente o limite de `5` publicações por usuário a cada minuto.

### Reactions e bookmarks

| Método | Caminho | Acesso | Request | Sucesso |
| --- | --- | --- | --- | --- |
| `PUT` | `/posts/:id/reaction` | Autenticado | `SetReactionDto` | `200 ReactionResponseDto`; cria ou troca. |
| `DELETE` | `/posts/:id/reaction` | Autenticado | — | `204`; desfaz e permanece idempotente. |
| `GET` | `/bookmarks` | Autenticado | `page`, `limit` | `200 Paginated<PostSummaryDto>`. |
| `PUT` | `/posts/:id/bookmark` | Autenticado | — | `200`; salva e permanece idempotente. |
| `DELETE` | `/posts/:id/bookmark` | Autenticado | — | `204`; remove e permanece idempotente. |

O clique repetido no frontend usa `DELETE` quando a reação ou bookmark já está ativo.

### Newsletter e campanhas

| Método | Caminho | Acesso | Request | Sucesso |
| --- | --- | --- | --- | --- |
| `POST` | `/newsletter/subscriptions` | Público limitado | `SubscribeNewsletterDto` | `202` com mensagem genérica. |
| `POST` | `/newsletter/subscriptions/confirm` | Público limitado | `ConfirmSubscriptionDto` | `200`; `400` inválido; `410` expirado. |
| `POST` | `/newsletter/subscriptions/unsubscribe` | Público limitado | `UnsubscribeDto` | `204` idempotente. |
| `GET` | `/admin/newsletter/subscribers` | ADMIN | `status`, `page`, `limit` | `200 Paginated<SubscriberAdminDto>`. |
| `GET` | `/admin/newsletter/campaigns` | ADMIN | `status`, `page`, `limit` | `200 Paginated<EmailCampaignAdminDto>`. |
| `GET` | `/admin/newsletter/campaigns/:id` | ADMIN | UUID | `200 EmailCampaignAdminDto`. |
| `POST` | `/admin/newsletter/campaigns` | ADMIN | `CreateCampaignDto` | `201 EmailCampaignAdminDto` em `DRAFT`. |
| `PATCH` | `/admin/newsletter/campaigns/:id` | ADMIN | `UpdateCampaignDto` | `200 EmailCampaignAdminDto`; somente `DRAFT`. |
| `POST` | `/admin/newsletter/campaigns/:id/send` | ADMIN | header `Idempotency-Key` | `202 EmailCampaignAdminDto`. |

Inscrição sempre responde de modo que não revele se o email já existia. Apenas `CONFIRMED` participa da audiência.
As três rotas públicas aceitam inicialmente até `5` solicitações por IP e por rota a cada minuto. Os links enviados apontam para páginas do frontend com o token no fragmento da URL, que não é enviado automaticamente ao servidor. O frontend apresenta o resultado, encaminha o token ao respectivo endpoint `POST` e remove o fragmento sem persistir o valor no navegador.

### Contact

| Método | Caminho | Acesso | Request | Sucesso |
| --- | --- | --- | --- | --- |
| `POST` | `/contact` | Público limitado | `CreateContactMessageDto` | `202`; persiste e solicita email ao administrador. |

O endpoint aceita inicialmente até `5` mensagens por IP a cada minuto e retorna apenas uma mensagem genérica, sem email, ID interno ou ID do provedor. Falha no envio do email não desfaz a mensagem persistida.

### Webhooks

| Método | Caminho | Acesso | Request | Sucesso |
| --- | --- | --- | --- | --- |
| `POST` | `/webhooks/resend` | Assinatura Resend | payload bruto assinado | `200` após processar ou reconhecer evento repetido. |

Eventos da V1:

- `email.bounced`: hard bounce altera o subscriber afetado para `BOUNCED`;
- `email.complained`: reclamação de spam altera o subscriber para `COMPLAINED`;
- `email.delivery_delayed`: registra falha temporária sem bloquear o subscriber;
- `email.delivered`, `email.failed` e `email.suppressed`: registram resultado técnico quando relacionado a envio conhecido;
- evento válido, mas não utilizado, recebe `200` e é ignorado com log seguro;
- `email.complained` não é enviado por todos os provedores; Gmail e Google Workspace são limitações conhecidas;
- o identificador do evento garante processamento idempotente.

## CORS, limites e segurança

- Produção aceita apenas as origins HTTP(S) exatas declaradas em `CORS_ALLOWED_ORIGINS`; curingas, caminhos, query strings e fragments são rejeitados na inicialização.
- Requests do frontend não enviam cookies à API: a política CORS usa `credentials: false` e o Bearer token do Supabase segue no header `Authorization`.
- Corpos JSON e URL-encoded aceitam no máximo `1 MiB`; uploads multipart mantêm os limites próprios documentados em suas rotas. O limite global também aparece na descrição do OpenAPI.
- O limitador global aceita `300` requests por minuto e aplica janelas mais restritas por rota: busca `60`, views `30`, comentários `5`, contato `5`, cada endpoint da newsletter `5` e webhook do Resend `120` requests por minuto.
- Usuários autenticados são limitados pelo ID; visitantes, pelo IP interpretado após o proxy confiável. A chave fica somente como SHA-256 em memória e cada controller/handler possui contador independente.
- O armazenamento em memória atende uma instância; múltiplas réplicas exigem Redis ou limitação equivalente no gateway.
- Upload verifica tamanho, MIME real, extensão e autorização antes de disponibilizar o objeto.
- Tokens de confirmação e cancelamento são armazenados como hash.
- Webhook usa corpo bruto para verificação de assinatura antes do parse de negócio.
- Logs JSON incluem `requestId`, método, rota sem query string, status, duração e ator técnico seguro. Corpo, email, cookies, Bearer token e demais segredos não são registrados; a política completa está em `docs/development/structured-logging.md`.

## Concorrência e idempotência

- Unique constraints protegem slug, email, reaction e bookmark.
- `PUT` de reaction/bookmark e respectivos `DELETE` são idempotentes.
- Inscrição e cancelamento não revelam estado anterior.
- Webhook repetido não duplica transição nem log de entrega.
- Envio de campanha exige `Idempotency-Key`; a mesma chave retorna a campanha já iniciada e não dispara novamente.
- Edição de post publicado e criação de sua revisão acontecem na mesma transação.
- Contadores de reação e visualização nunca são a única fonte de verdade do vínculo individual.

## Decisões aprovadas

1. Paginação usa limites por contexto: artigos e bookmarks `12/24`, comentários `20/50`, administração `20/100`; busca retorna no máximo `8` sem parâmetro `limit`.
2. Tags são informadas como `tagNames` no post e criadas/reutilizadas pela API; não há CRUD separado de tags na V1.
3. Avatar possui endpoints autenticados próprios e não reutiliza mídia editorial administrativa.
4. Preview usa o DTO administrativo do post e é renderizado em rota protegida no frontend.
5. Campanhas recebem endpoints de listagem, detalhe e edição antes do envio.
6. Histórico de edição de post publicado recebe endpoint administrativo paginado.
7. Alterar o slug de post publicado exige preservar o slug anterior e responder com redirecionamento permanente para a URL atual. O armazenamento desse histórico será detalhado no modelo de dados da Task 0.4.

## Critérios de validação

- Todas as funcionalidades obrigatórias do escopo possuem rota ou responsabilidade explicitamente externa à API.
- Toda rota declara método, caminho, acesso, request e sucesso.
- DTOs principais permitem iniciar controllers, frontend e geração do cliente.
- Paginação e erro possuem formato único.
- Ações de domínio usam códigos estáveis.
- Comentários nascem visíveis e posts publicados podem ser editados com revisão.
- Operações sensíveis possuem autorização, rate limit ou idempotência apropriados.
- O contrato OpenAPI implementado deverá permanecer compatível com este documento ou registrar a decisão que o substituiu.

## Referências

- `docs/product/v1-scope.md`
- `docs/product/domain-rules-and-states.md`
- `docs_personal/plano_execucao_vavito_archives.html`
- Notion: `Task 0.3 — Fechar contrato inicial da API`
