# Segurança HTTP da API

A camada transversal de segurança HTTP fica em `core/http/security` e é aplicada durante o bootstrap, antes do tratamento de rotas. Ela reúne headers seguros, CORS, limites de corpo e rate limiting sem transferir regras de negócio para `shared`.

## Headers e Swagger

O Helmet aplica os headers de segurança, incluindo Content Security Policy, `X-Content-Type-Options` e proteção contra framing. Quando o Swagger está habilitado, a CSP permite somente os estilos e scripts inline necessários à interface local; em produção, onde o Swagger é desabilitado por padrão, permanece a política padrão mais estrita do Helmet.

## CORS

`CORS_ALLOWED_ORIGINS` recebe uma lista separada por vírgulas. Cada item precisa ser uma origin HTTP(S) exata, como `https://vavitoarchives.com.br`, sem curinga, caminho, query string, fragment ou credenciais embutidas. Quando a variável é omitida, `FRONTEND_URL` é usado como única origin.

Requests sem header `Origin`, como integrações servidor a servidor e o webhook do Resend, continuam aceitos. A API não usa cookies de sessão e responde com `credentials: false`; autenticação do leitor ou administrador usa Bearer JWT.

## Limites de corpo

Corpos `application/json` e `application/x-www-form-urlencoded` aceitam até `1 MiB`. O Nest preserva o corpo bruto dentro desse limite para validar a assinatura do webhook. Exceder o valor retorna `413 PAYLOAD_TOO_LARGE` no contrato global. Uploads multipart não passam por esse parser e mantêm limites próprios por endpoint.

## Rate limiting

O `@nestjs/throttler` mantém contadores em memória por controller, handler e identidade. A identidade autenticada usa o ID do usuário; a anônima usa o primeiro IP interpretado pelo Express depois do proxy confiável. Antes de entrar no armazenamento, a identidade vira SHA-256 e não aparece em logs.

| Escopo | Limite por minuto |
| --- | ---: |
| Demais rotas | 300 |
| Busca pública | 60 |
| Registro de views | 30 |
| Webhook do Resend | 120 |
| Criação de comentário | 5 |
| Contato | 5 |
| Cada endpoint público da newsletter | 5 |

Ao exceder a janela, a API retorna `429 RATE_LIMIT_EXCEEDED` e informa `Retry-After`. Os limites específicos são declarados nos controllers e o padrão global protege as demais rotas.

Esse armazenamento atende apenas uma instância da V1. Antes de operar com múltiplas réplicas, ele deve ser substituído por Redis ou por um limitador equivalente no gateway para compartilhar os contadores.
