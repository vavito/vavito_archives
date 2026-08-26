# Mensagens de contato

O `ContactModule` recebe mensagens públicas, persiste o conteúdo antes de solicitar a notificação por email e responde sem revelar dados pessoais ou identificadores internos.

## Contrato HTTP

`POST /api/v1/contact` é público e retorna `202 Accepted` com a mesma resposta para toda mensagem aceita:

```json
{
  "message": "Mensagem recebida. Retornaremos assim que possível."
}
```

O corpo aceita:

- `name`: de 2 a 120 caracteres;
- `email`: endereço válido com até 320 caracteres;
- `subject`: opcional, de 1 a 255 caracteres; quando ausente, usa `Contato pelo site`;
- `message`: de 10 a 5.000 caracteres.

Nome, email e assunto são normalizados antes da persistência. Caracteres de controle inválidos são rejeitados pelo domínio. A resposta não inclui nome, email, ID da mensagem ou ID do provedor de email.

## Proteção contra abuso

O endpoint aceita inicialmente até 5 mensagens por IP a cada minuto. O IP é transformado em SHA-256 antes de ser usado como chave e não é registrado em logs.

O contador atual fica em memória e atende ao desenvolvimento e a uma única instância. Antes de escalar horizontalmente, ele deve ser substituído por um armazenamento compartilhado, como Redis ou o rate limit do gateway.

## Persistência e estados

A mensagem nasce como `RECEIVED`, sem `readAt` ou `archivedAt`. O domínio permite somente as transições:

```text
RECEIVED -> READ -> ARCHIVED
```

`READ` registra `readAt`; `ARCHIVED` registra `archivedAt`. A V1 arquiva mensagens em vez de apagá-las. As transições serão consumidas pela interface administrativa, sem ampliar o contrato público desta task.

## Notificação e rastreabilidade

Depois da persistência, a aplicação solicita o envio ao administrador por meio do `MailService`:

- `From`: `MAIL_CONTACT_FROM`;
- `To`: `MAIL_ADMIN_RECIPIENT`;
- `Reply-To`: email validado do visitante;
- chave de idempotência: `contact-message/<contactMessageId>`.

O template escapa nome, assunto e mensagem antes de produzir HTML. O email do visitante não aparece no corpo e é usado somente no cabeçalho `Reply-To`.

Quando o Resend aceita o envio, o log relaciona o ID interno da mensagem ao ID retornado pelo provedor. Falhas usam as tentativas limitadas do `MailModule`, são registradas apenas com o ID interno e não desfazem a mensagem persistida nem alteram a resposta `202`.
