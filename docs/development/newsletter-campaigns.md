# Campanhas da newsletter

As campanhas editoriais são administradas pelos endpoints sob `/api/v1/admin/newsletter/campaigns`. Todas as rotas exigem autenticação e `Profile.role = ADMIN`.

## Criação e preview

Uma campanha só pode ser criada para um post `PUBLISHED`. No momento da criação, a API congela título, resumo, slug, data de publicação e tempo de leitura em `postSnapshot`, além de produzir `htmlSnapshot` para o preview.

O preview é consultado pelo endpoint `GET /admin/newsletter/campaigns/:id`. Enquanto a campanha estiver em `DRAFT`, assunto, preview e HTML podem ser atualizados. Um HTML personalizado deve preservar o marcador `{{unsubscribeUrl}}`; o endereço individual de cancelamento só é inserido no momento do envio.

Edições posteriores no post não alteram os snapshots já armazenados na campanha.

## Envio único

O envio exige o header `Idempotency-Key` com um UUID. A mesma chave não pode pertencer a campanhas diferentes.

Antes de chamar o Resend, a API executa uma única transação que:

1. altera a campanha de `DRAFT` para `SENDING` somente se ela ainda não tiver sido iniciada;
2. congela a quantidade da audiência;
3. cria uma `EmailDelivery` para cada assinante `CONFIRMED`.

Esse bloqueio condicional impede que duas requisições concorrentes iniciem a mesma campanha. Repetir a requisição com a mesma chave retorna o estado já persistido sem disparar novos emails. Uma nova chave não reabre campanhas `SENDING`, `SENT` ou `FAILED`.

Cada destinatário recebe um email separado, com:

- chave do Resend `newsletter-campaign/<campaignId>/<deliveryId>`;
- link de artigo em `/artigos/:slug`;
- link de cancelamento personalizado no fragmento `#token=`;
- remetente definido em `MAIL_NEWSLETTER_FROM`.

O identificador exato de cada email fica em `EmailDelivery.providerEmailId`. Quando todos os pedidos são aceitos, a campanha passa para `SENT`; `EmailCampaign.resendId` registra o primeiro aceite como referência global da operação. `SENT` indica aceite pelo provedor, não entrega individual.

Se uma solicitação for rejeitada, a entrega correspondente e a campanha passam para `FAILED` com motivo técnico sanitizado. Entregas já aceitas não são reenviadas automaticamente. O endpoint desta versão não oferece retry de campanhas parcialmente aceitas, evitando duplicação para destinatários que já receberam um pedido válido.

## Estados

- `DRAFT`: editável e ainda não iniciado;
- `SENDING`: audiência congelada e envio em processamento;
- `SENT`: todos os pedidos foram aceitos pelo Resend;
- `FAILED`: ao menos um pedido não foi aceito e não há reenvio automático.

Webhooks assinados atualizam os estados individuais de entrega sem reabrir uma campanha `SENT`. Bounce permanente altera o subscriber para `BOUNCED`, atraso ou bounce transitório não o bloqueia, e reclamação de spam altera o subscriber para `COMPLAINED`. O processamento completo, incluindo idempotência e eventos fora de ordem, está documentado em `docs/development/resend-webhooks.md`.
