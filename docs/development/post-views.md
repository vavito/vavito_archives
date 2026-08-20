# Visualizações de posts

O endpoint público limitado `POST /api/v1/posts/:slug/views` responde com `202 Accepted`. Ele é chamado separadamente da leitura do artigo, portanto uma falha ou demora no registro não bloqueia a exibição do conteúdo.

## Deduplicação diária

A API combina o IP interpretado pelo Express com o user-agent e gera um HMAC SHA-256 diário. Somente o hash é persistido em `PostView`; IP e user-agent puros não são gravados. O segredo `VIEW_FINGERPRINT_SECRET` deve ser diferente dos demais segredos da aplicação e possuir pelo menos 32 caracteres.

A restrição única `(postId, fingerprintHash, bucketDate)` garante no PostgreSQL que o mesmo sinal técnico conte no máximo uma vez por post a cada dia. A inserção do `PostView` e o incremento de `Post.viewsCount` ocorrem em uma única instrução atômica. Posts que não estão em `PUBLISHED` retornam `404` e não recebem registros.

O servidor confia em um proxy reverso para interpretar corretamente o IP encaminhado pela plataforma de deploy. Produção deve manter apenas o proxy conhecido entre cliente e API.

## Proteção básica

A rota aceita até 30 tentativas por IP a cada minuto. A chave do limitador também é um HMAC e permanece somente na memória do processo. Ao exceder a janela, a API responde `429 RATE_LIMIT_EXCEEDED`.

Este limite específico atende à proteção básica da Task 4.8. A revisão e centralização de rate limits por rota permanece na Task 8.1; uma solução distribuída será necessária se a API operar com múltiplas instâncias.

## Ranking e retenção

`GET /api/v1/posts?sort=popular` ordena posts publicados por `viewsCount DESC` e usa `id ASC` como desempate estável. O público recebe apenas o total consolidado.

Os registros de `PostView` possuem retenção aprovada de 30 dias. A limpeza operacional será implementada pelo job auditável da Task 15.5 e não reduz `Post.viewsCount`.
