# API na Render

O arquivo [`render.yaml`](../../render.yaml) define a API como um Web Service Node.js a partir da
raiz do monorepo. Manter a raiz como contexto preserva o lockfile, os workspaces e as configurações
compartilhadas usadas pelo build de `apps/api`.

## Configuração versionada

| Campo | Valor | Motivo |
| --- | --- | --- |
| serviço | `vavito-archives-api` | nome estável para o painel e o subdomínio da Render |
| região | `virginia` | região disponível mais próxima do projeto Supabase em São Paulo |
| plano | `free` | ambiente inicial sem cobrança, sujeito a suspensão por inatividade |
| instâncias | `1` | o rate limit atual usa memória local |
| auto-deploy | `off` | a integração com os checks da CI será habilitada separadamente |
| domínio | `api.vavitoarchives.com.br` | origem pública da API |
| health check | `/api/v1/health` | verifica que o processo NestJS está respondendo |
| encerramento | padrão da Render | o NestJS trata `SIGTERM` pelos shutdown hooks disponíveis no plano gratuito |

A Render fornece `PORT` ao processo. A aplicação já escuta esse valor, confia em um proxy e expõe
também `GET /api/v1/health/ready`, que confirma a conexão com o PostgreSQL.

## Pipeline do serviço

Os comandos de build e start são executados pela raiz do repositório:

```bash
pnpm install --frozen-lockfile && pnpm --filter @vavito/api prisma:generate && pnpm --filter @vavito/api build
node apps/api/dist/main.js
```

A geração explícita do Prisma Client garante que os arquivos ignorados em
`apps/api/src/generated/prisma` existam antes da compilação, sem depender apenas do `postinstall`.
Essa etapa não acessa nem modifica o banco de dados.

O plano gratuito não oferece o comando de pre-deploy da Render. Antes de publicar uma versão com
novas migrations, execute manualmente, em uma rede que alcance o pooler de sessão do Supabase:

```bash
pnpm --filter @vavito/api prisma:migrate:status
pnpm --filter @vavito/api prisma:migrate:deploy
```

Somente inicie o deploy depois que ambos terminarem sem erro. Não mova migrations para o build: ele
não é a etapa transacional de promoção e pode ser repetido sem que a versão seja publicada. O
auto-deploy permanece desligado para preservar essa ordem.

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
3. confirme que o plano selecionado é `Free` e não solicita uma forma de pagamento;
4. informe somente no painel os valores protegidos solicitados;
5. confirme manualmente o status das migrations e só então inicie o deploy;
6. aguarde build e start concluírem sem erro;
7. configure no DNS o registro indicado pela Render para `api.vavitoarchives.com.br`;
8. aguarde a emissão do certificado TLS;
9. valide `https://api.vavitoarchives.com.br/api/v1/health` e
   `https://api.vavitoarchives.com.br/api/v1/health/ready`.

O retorno de health deve informar `status: ok` e `version: 0.1.0-rc.3`. Readiness precisa informar o
banco como `up`. Logs não podem conter URLs completas com senha, tokens, chaves ou dados pessoais.

## Falha e rollback

Se build ou migration falhar, mantenha a versão anterior ativa e corrija a causa antes de tentar
novamente. Para falha após a promoção, use o rollback da Render para o deploy anterior e repita
health, readiness e os fluxos atingidos. Não execute `prisma migrate reset` nem remova migrations já
aplicadas em produção.

O serviço gratuito pode suspender após um período sem tráfego e apresentar atraso na primeira
requisição seguinte. A migração para um plano pago permite restaurar o pre-deploy automático antes
de habilitar auto-deploys.
