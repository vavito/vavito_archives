# Performance das queries

A revisão da Task 8.3 cobre as leituras críticas da API, seus limites máximos, projeções Prisma e índices PostgreSQL. A meta local de regressão é de **até 100 ms de execução por consulta crítica** no banco de integração, sem incluir rede, autenticação, serialização HTTP ou serviços externos.

Essa meta é um guard rail do ambiente controlado, não um SLA de produção. Depois do deploy, latência, volume, cache e concorrência devem ser acompanhados pela observabilidade da aplicação e pelo PostgreSQL hospedado.

## Auditoria de N+1 e projeções

As listagens de posts, comentários e bookmarks carregam relações por `select` dentro do repository e não consultam o banco durante o mapeamento de cada item. O número de operações de leitura permanece limitado pela consulta paginada e pelas relações solicitadas, sem chamadas de repository dentro de loops de resposta.

Dois fluxos internos deixavam de ser N+1, mas carregavam dados muito maiores do que o necessário:

- criação e listagem de comentários consultavam o agregado completo do post, incluindo conteúdo JSONB, autor, tags, mídia e contadores de reação;
- criação e envio de campanhas carregavam o mesmo agregado para obter apenas o snapshot editorial resumido.

Os dois fluxos usam agora uma projeção publicada específica com `id`, `title`, `excerpt`, `publishedAt`, `readingTimeMinutes` e slug atual. O detalhe público do artigo continua usando o agregado completo porque realmente precisa do conteúdo e dos contadores.

O envio de campanha percorre destinatários individualmente porque cada email possui link próprio de cancelamento e estado de entrega. Isso não é uma leitura N+1 de endpoint; é o processamento intencional da audiência congelada da V1. Fila, concorrência controlada e envio em lotes permanecem evolução operacional para audiências maiores.

## Limites máximos

| Contexto | Padrão | Máximo |
| --- | ---: | ---: |
| Posts públicos e bookmarks | 12 | 24 |
| Comentários públicos | 20 | 50 |
| Listagens administrativas | 20 | 100 |
| Busca instantânea | 8 fixo | 8 |
| Lote do job de limpeza de mídia | configurável | 500 |

Os limites HTTP são validados nos DTOs antes de alcançar os repositories. A busca não aceita `limit` do cliente; o service aplica o valor fixo de oito resultados.

## Índices alinhados às consultas

| Leitura | Ordenação/filtro principal | Índice |
| --- | --- | --- |
| Posts recentes | `status`, `publishedAt DESC`, `id` | `Post_status_publishedAt_id_idx` |
| Posts populares | `status`, `viewsCount DESC`, `id` | `Post_status_viewsCount_id_idx` |
| Administração de posts | `updatedAt DESC`, `id`, com status opcional | `Post_updatedAt_id_idx`, `Post_status_updatedAt_id_idx` |
| Busca pública | trigramas de título, resumo e tag | índices `*_trgm_idx` |
| Threads públicas | `postId`, `parentId`, `createdAt`, `id` | `Comment_postId_parentId_createdAt_id_idx` |
| Moderação | data, post ou status com ordem decrescente | índices administrativos de `Comment` |
| Bookmarks | `profileId`, `createdAt DESC`, `id` | `Bookmark_profileId_createdAt_id_idx` |
| Limpeza de mídia | `status` e data de criação/orfandade | índices `MediaAsset_status_*_id_idx` |
| Audiência confirmada | `status`, `createdAt`, `id` | `NewsletterSubscriber_status_createdAt_id_idx` |
| Campanhas | `createdAt DESC`, `id`, com status opcional | índices administrativos de `EmailCampaign` |

## Verificação dos planos

O teste de integração confirma primeiro que todos os índices críticos existem. Em seguida, executa `ANALYZE` e usa `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` nas consultas críticas. Para tornar a escolha de um índice determinística mesmo com uma base de teste pequena, ele desabilita `Seq Scan` somente dentro da transação do teste. Cada plano precisa citar um dos índices compatíveis previamente declarados e permanecer dentro da meta local.

Em uma base vazia, índices com o mesmo prefixo de filtro e ordenação podem ter custo equivalente. Por exemplo, a consulta de threads pode usar o índice específico com `parentId` ou o índice administrativo do post em leitura reversa. Ambos são aceitos pelo teste, enquanto a verificação do catálogo garante que o índice específico continue disponível para bases com muitas respostas.

Em uma base representativa, valide novamente sem forçar o planner. Um `Seq Scan` em tabela pequena pode ser a escolha correta do PostgreSQL; em tabelas maiores, estatísticas atualizadas e seletividade determinam o plano real. Nunca desabilite `Seq Scan` na configuração da aplicação ou do banco de produção.

O plano específico da busca trigram está detalhado em `docs/development/posts-search.md`.
