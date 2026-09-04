# Busca pública de posts

O endpoint `GET /api/v1/posts/search?q=termo` busca somente posts publicados em título, resumo e nome das tags. A resposta usa `PostSummaryDto`, não possui paginação e retorna no máximo oito resultados.

## Normalização e segurança

O termo recebido é normalizado em NFC, tem espaços consecutivos reduzidos, extremidades removidas e caixa convertida para minúsculas com locale `pt-BR`. Os caracteres `%`, `_` e `\` são escapados antes do `LIKE`, portanto são tratados como texto do leitor e não como curingas SQL. Todos os valores continuam parametrizados pelo Prisma.

Os resultados são ordenados por relevância nesta prioridade:

1. título;
2. tag;
3. resumo.

Empates são resolvidos por `publishedAt DESC` e `id ASC`.

## Índices

A migration `20260819100000_add_post_search_indexes` habilita a extensão `pg_trgm` e cria:

- `Post_published_title_trgm_idx`, GIN parcial sobre o título de posts publicados;
- `Post_published_excerpt_trgm_idx`, GIN parcial sobre o resumo de posts publicados;
- `Tag_name_trgm_idx`, GIN sobre o nome da tag;
- `PostTag_tagId_idx`, B-tree para percorrer a relação a partir da tag.

O `pg_trgm` permite que PostgreSQL acelere pesquisas `LIKE` e `ILIKE` com padrões parciais. Termos com menos de três caracteres têm poucos trigramas e podem resultar em uma leitura maior do índice; a busca continua correta, mas é menos seletiva.

## Verificação do plano

### Banco usado pela aplicação

As migrations precisam estar aplicadas no banco configurado na API, não somente no PostgreSQL dos testes locais. Uma falha `function similarity(text, unknown) does not exist` pode indicar ausência de `pg_trgm`; confira a extensão e `prisma:migrate:status` antes de alterar SQL ou desabilitar a ordenação por relevância. Após confirmar o destino de `DIRECT_URL`, aplique as migrations pendentes com `pnpm --filter @vavito/api prisma:migrate:deploy`.

### Busca no frontend

O navegador consulta `GET /api/posts/search?q=...` na mesma origem do site. O Route Handler encaminha somente a pesquisa pública para a API configurada, preservando o limite de oito resultados e sem repassar credenciais do leitor. Assim, o iPhone acessando o frontend pela rede local não tenta consultar a própria porta `localhost:3001`. O cancelamento e o prazo de oito segundos encerram buscas pendentes; falhas recebem texto amigável.

### Ordenação da listagem

`GET /api/v1/posts` aceita `sort=recent` (padrão), `oldest`, `popular` e `least-viewed`. Data e visualizações são ordenadas no banco **antes** da paginação, com desempate por `id ASC`. A página Artigos preserva a ordenação ao trocar de tópico ou página; trocar a ordenação volta à primeira página.

### Medição

Atualize as estatísticas antes de medir uma base representativa:

```sql
ANALYZE "Post";
ANALYZE "Tag";
ANALYZE "PostTag";
```

Em seguida, use `EXPLAIN (ANALYZE, BUFFERS)` na consulta gerada pelo repositório. Para o ramo de título, por exemplo:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT "id"
FROM "Post"
WHERE
  "status" = 'PUBLISHED'::"PostStatus"
  AND lower("title") LIKE '%postgresql%' ESCAPE '\';
```

Com volume representativo, o plano esperado contém `Bitmap Index Scan` usando `Post_published_title_trgm_idx`. Em tabelas pequenas, PostgreSQL pode escolher `Seq Scan` por estimá-lo mais barato; isso é uma decisão normal do otimizador, não evidência de que o índice esteja ausente.

Referências oficiais: [índices trigram e buscas `LIKE`](https://www.postgresql.org/docs/17/pgtrgm.html) e [leitura de planos com `EXPLAIN`](https://www.postgresql.org/docs/current/using-explain.html).
