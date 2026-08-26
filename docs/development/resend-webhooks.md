# Webhooks do Resend

O endpoint `POST /api/v1/webhooks/resend` recebe os eventos técnicos de entrega do Resend. A rota não usa JWT, mas só aceita um corpo bruto cuja assinatura seja validada pelo SDK oficial antes de qualquer regra de negócio.

## Configuração

```env
RESEND_WEBHOOK_SECRET=whsec_replace_with_webhook_signing_secret
```

O valor é o signing secret exibido pelo Resend para o endpoint criado no dashboard. Ele é diferente de `RESEND_API_KEY`, deve permanecer apenas no ambiente da API e não pode ser exposto no frontend ou versionado.

No Resend, cadastrar a URL pública da API com o caminho `/api/v1/webhooks/resend` e habilitar pelo menos:

- `email.delivered`;
- `email.delivery_delayed`;
- `email.bounced`;
- `email.complained`;
- `email.failed`;
- `email.suppressed`.

O NestJS preserva o corpo bruto da requisição. A verificação usa os headers `svix-id`, `svix-timestamp` e `svix-signature`; ausências ou assinatura inválida retornam `401 WEBHOOK_SIGNATURE_INVALID`. Um payload assinado que não atende ao contrato mínimo retorna `400 WEBHOOK_PAYLOAD_INVALID`.

## Efeitos dos eventos

| Evento | `EmailDelivery` | `NewsletterSubscriber` |
| --- | --- | --- |
| `email.delivered` | `DELIVERED` | sem alteração |
| `email.delivery_delayed` | `DELIVERY_DELAYED` | sem alteração |
| `email.bounced` permanente/hard | `BOUNCED` | `BOUNCED`, se estava `CONFIRMED` |
| `email.bounced` transitório | `DELIVERY_DELAYED` | sem alteração |
| `email.complained` | `COMPLAINED` | `COMPLAINED`, se estava `CONFIRMED` ou `BOUNCED` |
| `email.failed` | `FAILED` | sem alteração |
| `email.suppressed` | `SUPPRESSED` | sem alteração |

Eventos válidos não usados pela V1 e eventos sem uma entrega correlacionada ainda são registrados e recebem `200`. Isso evita novas tentativas desnecessárias do provedor sem inventar uma transição local.

O Resend não recebe reclamações de spam de todos os provedores. Em particular, Gmail e Google Workspace podem não produzir `email.complained`; nesse caso a aplicação não tem evento para aplicar.

## Idempotência, ordem e concorrência

- `WebhookEvent.providerEventId` é único. A repetição do mesmo ID e payload retorna `200` sem repetir efeitos.
- O hash SHA-256 do corpo bruto permite detectar a reutilização anômala do mesmo ID com outro payload; a API registra o conflito sem expor o corpo.
- `EmailDelivery.lastEventAt` impede que um evento antigo reverta um estado mais recente.
- `COMPLAINED` é terminal na V1. `BOUNCED` e `SUPPRESSED` só admitem uma reclamação posterior.
- A criação de `WebhookEvent` e as alterações em `EmailDelivery` e `NewsletterSubscriber` acontecem na mesma transação PostgreSQL.
- A atualização do subscriber usa seu `updatedAt` anterior como controle otimista; uma mudança concorrente desfaz toda a transação para permitir uma nova tentativa segura.
- Webhooks não reabrem nem alteram o estado global de uma campanha `SENT`.

Os logs contêm somente identificadores técnicos e o resultado do processamento. Email, conteúdo enviado, assinatura e payload bruto não são registrados.

## Teste local

O Resend precisa alcançar uma URL HTTPS pública. Para um teste manual local, expor temporariamente a porta da API com um túnel confiável, cadastrar a URL temporária no endpoint de teste e usar o signing secret correspondente. Não reutilizar segredos de produção.

Os testes automatizados não chamam o Resend: o cliente de verificação e o processamento são controlados por mocks, enquanto o corpo bruto, os códigos HTTP, as transições e a idempotência são verificados localmente.

