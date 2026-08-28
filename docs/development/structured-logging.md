# Logging estruturado

A API usa Pino por meio do `nestjs-pino` para emitir logs JSON em `stdout`. O módulo transversal fica em `core/observability`, é registrado uma única vez no `AppModule` e associa automaticamente o contexto da requisição aos logs produzidos por controllers, services e infraestrutura.

## Nível de log

`LOG_LEVEL` aceita `fatal`, `error`, `warn`, `info`, `debug`, `trace` ou `silent`. O padrão validado é `info`; desenvolvimento pode usar `debug`, enquanto os testes automatizados usam `silent` quando não precisam inspecionar a saída.

## Correlação por requestId

O cliente pode enviar `X-Request-Id` com 1 a 128 caracteres alfanuméricos ou os símbolos `.`, `_`, `:` e `-`. Um valor ausente ou inválido é substituído por UUID. O identificador é atribuído antes da execução dos guards, aparece em todos os logs da requisição e volta no header da resposta, inclusive em sucessos e erros.

O contrato global de erro usa o identificador já atribuído pelo middleware. Assim, o `requestId` do corpo, do header e dos logs representa a mesma requisição.

## Campos HTTP

Os eventos automáticos de entrada e saída registram somente metadados operacionais:

- `requestId`;
- método e path sem query string;
- status da resposta e `durationMs`;
- `actorType` e, após autenticação, apenas o UUID técnico em `actorId`;
- contexto do componente, nível e mensagem do evento.

Rotas públicas usam `actorType: anonymous`. O interceptor de logging é executado depois dos guards e enriquece os logs autenticados sem registrar email, claims ou o JWT.

## Sanitização

O serializer HTTP usa uma lista explícita de campos permitidos. Corpo, query string, endereço IP, user agent e coleção completa de headers não entram nos logs. A configuração de redaction também censura campos conhecidos como `authorization`, `cookie`, `password`, `token`, `accessToken`, `refreshToken` e `secret`, inclusive quando aninhados, caso algum componente tente registrá-los como propriedades estruturadas.

Não registrar manualmente:

- Bearer tokens, cookies, senhas, secrets ou chaves de provedores;
- emails, conteúdo de comentários, mensagens de contato ou newsletter;
- corpo bruto ou assinatura do webhook;
- buffers, URLs assinadas ou respostas brutas de Supabase e Resend.

## Erros

Falhas HTTP automáticas registram status, duração, `requestId`, rota, ator técnico e somente o tipo do erro. O filtro global acrescenta o evento `http_request_failed` em falhas `5xx` sem incluir mensagem interna, stack ou detalhes potencialmente sensíveis. A resposta pública continua usando o contrato seguro de erros da API.

Para investigar uma falha, pesquisar o `requestId` informado ao cliente. Todos os eventos produzidos dentro da mesma requisição carregam esse identificador.
