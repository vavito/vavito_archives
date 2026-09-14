# Release candidate da V1

Este runbook congela o Vavito Archives `v0.1.0-rc.3` e define a evidência mínima para promover ou
reverter a aplicação. As tags anteriores, `v0.1.0-rc.1` e `v0.1.0-rc.2`, registram o hardening da
API e o primeiro congelamento full stack e permanecem imutáveis.

## Identificação da versão

- versão do monorepo: `0.1.0-rc.3` em `package.json`;
- versão exposta pela API: `APP_VERSION=0.1.0-rc.3`;
- tag planejada: `v0.1.0-rc.3`;
- histórico funcional: [`CHANGELOG.md`](../../CHANGELOG.md).

O ambiente publicado deve definir `APP_VERSION` explicitamente. A resposta de
`GET /api/v1/health` é a confirmação externa da versão efetivamente executada.

## Gates de congelamento

Use Node.js e pnpm nas versões declaradas pelo repositório e execute, pela raiz:

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm security:check
pnpm api-client:check
pnpm test:e2e:full-stack
pnpm test:e2e:a11y
pnpm test:performance:web
```

A regressão da API exige o PostgreSQL local isolado `vavito_integration`. O helper seguro para
PowerShell está em [Regressão do backend](backend-regression.md). Nenhum gate local pode apontar
para o Supabase de staging ou produção.

O congelamento deve ser interrompido quando houver teste falhando, alteração não revisada, migration
pendente, segredo versionado, vulnerabilidade alta ou crítica, ou divergência entre o OpenAPI e o
cliente gerado.

## Criação da tag

Crie a tag somente depois que os arquivos da RC estiverem commitados, a revisão estiver aprovada e
o worktree estiver limpo:

```bash
git status --short
git tag -a v0.1.0-rc.3 -m "Vavito Archives v0.1.0-rc.3"
git show v0.1.0-rc.3 --no-patch
```

O envio da tag acontece junto da entrega autorizada:

```bash
git push origin v0.1.0-rc.3
```

Uma tag publicada nunca é movida. Uma correção posterior recebe `v0.1.0-rc.4`.

## Preparação do ambiente

Antes da promoção:

1. registre o commit e a versão atualmente em produção;
2. gere um backup do PostgreSQL e confirme que ele pode ser restaurado em um destino isolado;
3. valide os domínios e redirects do Supabase Auth;
4. confira buckets, remetentes e domínio verificado do Resend;
5. configure as variáveis da API e da Web usando os nomes de `.env.example` e
   `apps/web/.env.example`;
6. confirme HTTPS, CORS exato, segredos distintos e `SWAGGER_ENABLED=false`;
7. mantenha uma única instância da API enquanto o rate limit continuar em memória.

As revisões detalhadas estão em [Segurança e privacidade](security-privacy-go-live.md),
[Supabase Auth](supabase-auth.md), [Storage](media-storage.md) e [Resend](resend-email.md).

## Ordem de promoção

1. aplique as migrations com `pnpm --filter @vavito/api prisma:migrate:deploy`;
2. publique a API na Render com `APP_VERSION=0.1.0-rc.3`;
3. valide `GET /api/v1/health` e `GET /api/v1/health/ready`;
4. publique a Web na Vercel apontando para a origem validada da API;
5. execute os smoke tests abaixo antes de liberar a divulgação.

### Smoke tests

- visitante abre Home, lista, busca e artigo publicado com capa;
- usuário cria conta, confirma o email, entra e recupera a senha;
- usuário edita perfil, comenta, reage e salva um artigo;
- administrador acessa `/admin/posts`, salva um rascunho, abre preview e publica;
- inscrição, confirmação e cancelamento da newsletter chegam à origem pública correta;
- campanha de um artigo e campanha de vários artigos mantêm layout, links e cancelamento;
- contato e notificações administrativas chegam pelo remetente esperado;
- logs não exibem tokens, emails completos, segredos ou conteúdo sensível.

## Plano de rollback

### Aplicação

1. suspenda novas promoções e registre o erro, horário e versão afetada;
2. restaure na Render e na Vercel o commit que estava em produção antes da RC;
3. mantenha as variáveis desse ambiente alinhadas à versão restaurada;
4. valide health, readiness e os fluxos diretamente afetados;
5. reabra o tráfego somente depois do smoke test mínimo.

As migrations desta RC adicionam campos e ajustam vínculos para preservar campanhas e excluir a
conversa junto do artigo. O código anterior pode conviver com os campos adicionais, então o primeiro
rollback deve ser apenas da aplicação.

### Banco de dados

Não execute `prisma migrate reset`, não apague migrations aplicadas e não improvise SQL reverso em
produção. Se uma migration causar perda ou corrupção:

1. bloqueie as escritas afetadas;
2. restaure o backup anterior em um projeto PostgreSQL isolado;
3. valide contagens, relacionamentos e uma amostra dos dados;
4. aponte a aplicação restaurada para o banco validado;
5. preserve o banco problemático para investigação.

### Provedores externos

Mudanças de redirects, templates do Supabase, buckets ou configuração do Resend devem ter o valor
anterior registrado antes do deploy. Reverta primeiro a configuração alterada e repita o fluxo real
de confirmação, recuperação, mídia ou email correspondente.

## Limitações conhecidas

- o rate limit da API usa memória local; produção deve manter uma instância ou adotar Redis/proteção
  equivalente antes de escalar horizontalmente;
- Gmail e Google Workspace podem não comunicar reclamações de spam ao Resend, então o estado do
  assinante só muda quando o webhook é efetivamente recebido;
- as jornadas E2E usam dublês locais para Supabase, Storage e Resend; os smoke tests no ambiente de
  destino continuam obrigatórios;
- a auditoria Lighthouse usa conteúdo controlado e rede simulada; métricas reais precisam ser
  acompanhadas após o deploy;
- Axe cobre violações automatizáveis, mas não substitui revisão manual com teclado e tecnologia
  assistiva;
- não existem migrations automáticas de retorno; rollback destrutivo do banco depende de backup
  previamente verificado.

## Evidência da release

Registre na task e no pull request:

- commit e tag aprovados;
- resultado dos gates locais e dos checks `Quality / API` e `Quality / Web`;
- backup utilizado como ponto de restauração;
- versões promovidas na Render e na Vercel;
- resultado dos smoke tests e qualquer limitação aceita.
