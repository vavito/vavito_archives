# Inscrições da newsletter

O `NewsletterModule` oferece double opt-in público sem associar o assinante a um `Profile`. O fluxo persiste apenas hashes de tokens e nunca informa se um email já estava cadastrado.

## Fluxo

1. `POST /api/v1/newsletter/subscriptions` normaliza o email e registra consentimento, origem e data.
2. Uma inscrição nova, pendente, cancelada ou com bounce recebe um novo token de confirmação válido por 24 horas.
3. O email transacional contém links para `${FRONTEND_URL}/newsletter/confirm` e `${FRONTEND_URL}/newsletter/unsubscribe`, com o token no fragmento `#token=`.
4. As páginas do frontend leem o fragmento, encaminham o token para os endpoints `POST` da API, removem o fragmento da URL e apresentam o resultado sem guardar o valor.
5. Somente o estado `CONFIRMED` será elegível para campanhas.

Enquanto as páginas do frontend não forem implementadas, o fluxo backend pode ser validado enviando diretamente os mesmos tokens para os endpoints `POST` documentados no Swagger.

## Tokens e privacidade

- Tokens possuem 32 bytes aleatórios ou derivados e são representados em base64url com 43 caracteres.
- O fragmento não é enviado ao servidor durante a navegação, evitando que o token apareça automaticamente em access logs ou cabeçalhos de referência.
- O token de confirmação é aleatório, armazenado como SHA-256 e removido depois da confirmação ou cancelamento.
- Uma nova solicitação em `PENDING` substitui o token anterior, permitindo recuperar links expirados.
- O token de cancelamento é derivado por HMAC-SHA-256 de `NEWSLETTER_TOKEN_SECRET` e do UUID do assinante. A aplicação consegue reconstruir o link, mas persiste somente seu SHA-256.
- `NEWSLETTER_TOKEN_SECRET` deve ter ao menos 32 caracteres, permanecer igual entre réplicas da API e ser armazenado somente no ambiente protegido.
- Alterar esse segredo invalida os links de cancelamento emitidos anteriormente e exige uma estratégia operacional de rotação.

## Idempotência e antiabuso

- Subscribe sempre retorna `202` com a mesma mensagem genérica, inclusive para emails confirmados, suprimidos ou disputados por requests concorrentes.
- A solicitação de email começa somente depois da persistência e não bloqueia a resposta HTTP, reduzindo diferenças de tempo que poderiam ajudar a enumerar endereços.
- Falha no envio da confirmação é registrada sem email ou token e não altera a resposta pública.
- Unsubscribe retorna `204` para token desconhecido, assinatura já cancelada ou outro estado já inelegível.
- Confirmação retorna `400` para token inválido e `410` para token expirado; tokens consumidos deixam de ser válidos.
- Cada endpoint aceita inicialmente cinco solicitações por IP a cada minuto. A chave mantida em memória usa apenas o hash do IP e da rota.

O limitador em memória protege uma instância durante a V1. Um limitador compartilhado deverá substituí-lo caso a API opere com múltiplas réplicas.
