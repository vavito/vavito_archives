# Campanhas da newsletter

As campanhas editoriais são administradas pelos endpoints sob `/api/v1/admin/newsletter/campaigns`. Todas as rotas exigem autenticação e `Profile.role = ADMIN`.

## Criação e preview

Uma campanha pode reunir de um a cinco posts `PUBLISHED`. No momento da criação, a API congela título, resumo, slug, capa, data de publicação e tempo de leitura de cada artigo em `postSnapshot`, além de produzir `htmlSnapshot` para o preview. O primeiro artigo permanece como referência principal para compatibilidade histórica.

O formato do snapshot depende da quantidade selecionada:

- com um artigo, o email apresenta título, resumo, autor, data, tempo de leitura, capa e o conteúdo completo convertido do JSON Tiptap para HTML seguro; depois do texto, exibe a CTA para ler e acompanhar no site;
- com dois a cinco artigos, o email apresenta somente cards de preview com capa, título, resumo, metadados e link individual. As capas usam uma moldura de altura uniforme, `object-fit: cover` e o enquadramento salvo pelo editor, evitando que a dimensão original de cada arquivo altere o layout da campanha.

Os dois formatos terminam com a assinatura visual do Vavito Archives e o cancelamento da inscrição. O HTML usa estilos inline e uma adaptação compacta para telas de até 600 px. Links e atributos editoriais são escapados, URLs do conteúdo aceitam somente protocolos seguros e a versão textual enviada ao provedor inclui o conteúdo legível e os links essenciais.

A listagem administrativa usa `createdAt DESC` e `id ASC`, portanto apresenta primeiro as campanhas mais recentes.

O preview é consultado pelo endpoint `GET /admin/newsletter/campaigns/:id`. Enquanto a campanha estiver em `DRAFT`, assunto, preview e HTML podem ser atualizados. Um HTML personalizado deve preservar o marcador `{{unsubscribeUrl}}`; o endereço individual de cancelamento só é inserido no momento do envio.

Edições posteriores no post não alteram os snapshots já armazenados na campanha.
Campanhas criadas antes da introdução desses formatos preservam o HTML que já haviam congelado; o novo padrão é aplicado ao criar uma nova campanha.
Se um artigo for excluído permanentemente depois da criação, campanhas existentes preservam o conteúdo congelado e o histórico de entrega, mas perdem a referência relacional para o post removido. Campanhas ainda não enviadas voltam a validar todos os artigos e não podem ser disparadas com uma seleção que deixou de existir.

## Envio único

O envio exige o header `Idempotency-Key` com um UUID. A mesma chave não pode pertencer a campanhas diferentes.

Antes de chamar o Resend, a API executa uma única transação que:

1. altera a campanha de `DRAFT` para `SENDING` somente se ela ainda não tiver sido iniciada;
2. congela a quantidade da audiência;
3. cria uma `EmailDelivery` para cada assinante `CONFIRMED`.

Esse bloqueio condicional impede que duas requisições concorrentes iniciem a mesma campanha. Repetir a requisição com a mesma chave retorna o estado já persistido sem disparar novos emails. Uma nova chave não reabre campanhas `SENDING`, `SENT` ou `FAILED`.

Cada destinatário recebe um email separado, com:

- chave do Resend `newsletter-campaign/<campaignId>/<deliveryId>`;
- links dos artigos selecionados em `/artigos/:slug` e suas capas, quando disponíveis;
- link de cancelamento personalizado no fragmento `#token=`;
- remetente definido em `MAIL_NEWSLETTER_FROM`.

O identificador exato de cada email fica em `EmailDelivery.providerEmailId`. Quando todos os pedidos são aceitos, a campanha passa para `SENT`; `EmailCampaign.resendId` registra o primeiro aceite como referência global da operação. `SENT` indica aceite pelo provedor, não entrega individual.

Se uma solicitação for rejeitada, a entrega correspondente e a campanha passam para `FAILED` com motivo técnico sanitizado. Entregas já aceitas não são reenviadas automaticamente. O endpoint desta versão não oferece retry de campanhas parcialmente aceitas, evitando duplicação para destinatários que já receberam um pedido válido.

## Estados

- `DRAFT`: editável e ainda não iniciado;
- `SENDING`: audiência congelada e envio em processamento;
- `SENT`: todos os pedidos foram aceitos pelo Resend;
- `FAILED`: ao menos um pedido não foi aceito e não há reenvio automático.

Campanhas `DRAFT` e `FAILED` podem ser excluídas pelo administrador. Estados `SENDING` e `SENT`
não permitem exclusão para preservar o histórico operacional e evitar interpretações incorretas do envio.

Webhooks assinados atualizam os estados individuais de entrega sem reabrir uma campanha `SENT`. Bounce permanente altera o subscriber para `BOUNCED`, atraso ou bounce transitório não o bloqueia, e reclamação de spam altera o subscriber para `COMPLAINED`. O processamento completo, incluindo idempotência e eventos fora de ordem, está documentado em `docs/development/resend-webhooks.md`.
