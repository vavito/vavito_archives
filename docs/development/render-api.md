# API na Render

O arquivo [`render.yaml`](../../render.yaml) define a API como um Web Service Node.js a partir da
raiz do monorepo. Manter a raiz como contexto preserva o lockfile, os workspaces e as configurações
compartilhadas usadas pelo build de `apps/api`.

## Configuração versionada

| Campo | Valor | Motivo |
| --- | --- | --- |
| serviço | `vavito-archives-api` | nome estável para o painel e o subdomínio da Render |
| região | `virginia` | região disponível mais próxima do projeto Supabase em São Paulo |
| plano | `0.5c-512mb` | menor instância paga; necessária para o pre-deploy da migration |
| instâncias | `1` | o rate limit atual usa memória local |
| auto-deploy | `off` | a integração com os checks da CI será habilitada separadamente |
| domínio | `api.vavitoarchives.com.br` | origem pública da API |
| health check | `/api/v1/health` | verifica que o processo NestJS está respondendo |
| encerramento | 30 segundos | permite ao NestJS tratar `SIGTERM` pelos shutdown hooks |

A Render fornece `PORT` ao processo. A aplicação já escuta esse valor, confia em um proxy e expõe
também `GET /api/v1/health/ready`, que confirma a conexão com o PostgreSQL.

## Pipeline do serviço

Os comandos são executados pela raiz do repositório:

```bash
pnpm install --frozen-lockfile && pnpm --filter @vavito/api build
pnpm --filter @vavito/api prisma:migrate:deploy
node apps/api/dist/main.js
```

O segundo comando é o pre-deploy. Se a migration falhar, a nova versão não substitui a versão ativa.
Esse recurso exige uma instância paga da Render; não mova migrations para o build, pois o build não
é a etapa transacional de promoção do serviço.

## Variáveis protegidas

No primeiro sync do Blueprint, preencha os campos marcados com `sync: false` sem copiá-los para o
repositório:

| Variável | Origem |
| --- | --- |
| `DATABASE_URL` | Supabase, pooler de transação para o tráfego normal da API |
| `DIRECT_URL` | Supabase, pooler de sessão para o Prisma Migrate |
| `SUPABASE_URL` | URL HTTPS do projeto Supabase de produção |
| `SUPABASE_SERVICE_ROLE_KEY` | chave server-only do Supabase |
| `RESEND_API_KEY` | API key server-only do Resend |
| `RESEND_WEBHOOK_SECRET` | signing secret do webhook do Resend |
| `MAIL_ADMIN_RECIPIENT` | caixa que recebe mensagens e notificações administrativas |
| `MAIL_REPLY_TO` | caixa monitorada usada nas respostas |
| `NEWSLETTER_TOKEN_SECRET` | segredo aleatório exclusivo, com pelo menos 32 caracteres |
| `REVALIDATION_SECRET` | segredo aleatório exclusivo, com pelo menos 32 caracteres |
| `VIEW_FINGERPRINT_SECRET` | segredo aleatório exclusivo, com pelo menos 32 caracteres |

Não reutilize os três segredos da aplicação. Para o Supabase, use conexão com SSL e credenciais do
ambiente de produção. O `DATABASE_URL` deve limitar conexões de acordo com a capacidade do banco; o
`DIRECT_URL` precisa suportar sessões para que o Prisma aplique migrations com segurança.

As demais variáveis não sensíveis ficam declaradas no Blueprint, incluindo `NODE_ENV=production`,
Swagger desabilitado, CORS restrito a `https://vavitoarchives.com.br` e os remetentes verificados.

## Criação e validação

1. envie o `render.yaml` para a branch aprovada no GitHub;
2. na Render, crie um Blueprint conectado ao repositório privado e à branch principal;
3. revise a instância paga antes de confirmar a criação;
4. informe somente no painel os valores protegidos solicitados;
5. aguarde build, pre-deploy e start concluírem sem erro;
6. configure no DNS o registro indicado pela Render para `api.vavitoarchives.com.br`;
7. aguarde a emissão do certificado TLS;
8. valide `https://api.vavitoarchives.com.br/api/v1/health` e
   `https://api.vavitoarchives.com.br/api/v1/health/ready`.

O retorno de health deve informar `status: ok` e `version: 0.1.0-rc.3`. Readiness precisa informar o
banco como `up`. Logs não podem conter URLs completas com senha, tokens, chaves ou dados pessoais.

## Falha e rollback

Se build ou migration falhar, mantenha a versão anterior ativa e corrija a causa antes de tentar
novamente. Para falha após a promoção, use o rollback da Render para o deploy anterior e repita
health, readiness e os fluxos atingidos. Não execute `prisma migrate reset` nem remova migrations já
aplicadas em produção.
