# Integração contínua

O workflow `.github/workflows/quality.yml` executa a qualidade do monorepo em pull requests e em pushes para `main`.

## Checks

- `Quality / API`: segredos e dependências de produção, formatação, regressão com cobertura, lint, typecheck e build da API e de suas dependências internas.
- `Quality / Web`: formatação, sincronização do cliente OpenAPI, testes de componente e integração, fluxos públicos, autenticados e administrativos no Playwright, lint, typecheck e build do frontend e de suas dependências internas.
- `Quality / Deploy Gate`: consolida os dois jobs e aprova somente quando ambos terminam com `success`; falha se algum workspace falhar, for cancelado ou ignorado.

O job da API também exporta o OpenAPI a partir dos controllers e DTOs compilados, compara o JSON com
o artefato versionado e verifica os tipos do api-client contra esse contrato. Assim, a sincronização
não depende apenas de gerar tipos a partir de um JSON que pode estar desatualizado.

A etapa de exportação declara um ambiente `test` com valores fictícios para as variáveis
obrigatórias de Supabase, email e segurança, sem depender de `.env` local ou secrets de produção.
As URLs de serviços são locais e a conexão inicial ao banco fica desativada. A exportação não
inicializa a aplicação nem envia emails; mantém a validação de ambiente e usa a versão real do
`package.json` para comparar o contrato. O teste `workflow-environment.spec.ts` verifica esse
ambiente diretamente a partir do workflow versionado.

Os dois workspaces são sempre verificados, sem filtros de caminhos. Essa escolha conservadora cobre
mudanças nos packages compartilhados, lockfile, ferramentas e contratos sem omitir dependências.

Cada job usa Node.js 24.18.0 e a versão do pnpm declarada em `packageManager`, instala o monorepo pela raiz com `pnpm install --frozen-lockfile` e mantém caches separados do pnpm e do Turborepo.

O check `pnpm security:check` falha quando encontra um arquivo de ambiente versionado, um padrão de
credencial conhecido, uma referência a segredo server-only no frontend ou uma vulnerabilidade
conhecida com severidade alta ou crítica. A matriz focada e o checklist operacional estão em
[Revisão de segurança e privacidade para go-live](security-privacy-go-live.md).

O job da API sobe um service container PostgreSQL exclusivo, aguarda o `pg_isready`, prepara um fixture mínimo de `auth.users`, aplica as migrations versionadas com `prisma migrate deploy` e executa `test:regression:api`. A regressão cobre testes unitários, E2E, cobertura mínima, ausência de testes ignorados e toda a suíte de integração. O job da Web não sobe banco: ele executa o Vitest com jsdom e Testing Library e os fluxos públicos Playwright antes do lint, typecheck e build de produção compatível com a Vercel.

Os testes do frontend ficam em `apps/web/test`, separados por nível (`component` e `integration`) e por módulo. O setup compartilhado da Testing Library fica em `apps/web/test/helpers`. Para executar apenas essa suíte pela raiz:

```bash
pnpm test:web
```

O comando equivalente usado pela CI é `pnpm turbo run test --filter=@vavito/web...`. O sufixo `...` inclui as dependências internas do workspace Web, enquanto o cache persistido em `.turbo` evita repetir tarefas cujo conteúdo não mudou.

Os fluxos completos das páginas públicas ficam em `tests/e2e/public` e executam a aplicação em tamanhos desktop e mobile. Uma API local controlada fornece os fixtures de posts e tags; portanto, a suíte não acessa banco, Supabase, API publicada nem credenciais. Ela cobre a navegação entre Home, listagem e leitura, a busca global, o feedback de indisponibilidade e a convivência entre rodapé e navegação móvel.

Na primeira execução local, instale Chromium e WebKit administrados pelo Playwright e depois rode a suíte pela raiz. O WebKit usa emulação de iPhone para cobrir também o motor do Safari:

```bash
pnpm --filter @vavito/e2e exec playwright install chromium webkit
pnpm test:e2e:public
```

O Playwright inicia e encerra automaticamente a API controlada na porta `4100` e o Next.js na porta `3100`, sem ocupar as portas padrão usadas no desenvolvimento.

A suíte autenticada (`pnpm test:e2e:auth`) roda em seguida, com Next.js em `3101` e dublê de Auth/API em `4101`, reutilizando o servidor de conteúdo público em `4100`. Ambas usam `.next-e2e` para não disputar o cache do desenvolvimento. As contas e dados desses testes são locais e descartáveis. Consulte [Testes dos fluxos autenticados](authenticated-flows-testing.md) para cobertura e limites dessa validação.

A suíte administrativa (`pnpm test:e2e:admin`) usa Next.js em `3102` e um dublê local de Auth, API e mídia em `4102`. O fluxo cria um rascunho, aplica formatação pela toolbar, confirma o autosave, envia uma capa controlada, revisa o preview protegido e publica o artigo. A execução usa somente Chromium desktop e não acessa serviços externos.

O comando `pnpm test:e2e:full-stack` executa as três suítes em sequência e é a entrada usada pelo job `Quality / Web`. Além das regressões já existentes, ele cobre cadastro até comentário, inscrição e cancelamento da newsletter e envio de contato sem intervenção. Consulte [Jornadas E2E full stack](full-stack-e2e.md) para cobertura, isolamento e limites.

No runner compartilhado da CI, a suíte pública usa um worker para não disputar CPU com o servidor
Next.js. Localmente ela preserva dois workers. O launcher do Lighthouse distingue uma CLI JavaScript
de um binário nativo do pnpm, permitindo a mesma execução no Windows e no Linux.

O fixture existe apenas porque o PostgreSQL puro da CI não inclui o schema gerenciado pelo Supabase Auth. Ele contém somente as colunas consumidas pelo trigger de criação de `Profile`, é protegido pela mesma validação de URL local da suíte e nunca é aplicado ao Supabase.

O banco de integração usa apenas `localhost`, possui o nome fixo `vavito_integration` e é descartado com o runner ao final da execução. O teste também remove os registros temporários em um bloco `finally`. Uma proteção no código recusa hosts remotos, inclusive URLs do Supabase, e recusa qualquer outro nome de banco.

Para executar a suíte fora da CI, disponibilize um PostgreSQL local com o banco `vavito_integration`, aplique as migrations e informe a URL dedicada:

```bash
INTEGRATION_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vavito_integration corepack pnpm --filter @vavito/api test:integration:prepare
DIRECT_URL=postgresql://postgres:postgres@localhost:5432/vavito_integration corepack pnpm --filter @vavito/api prisma:migrate:deploy
INTEGRATION_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vavito_integration corepack pnpm --filter @vavito/api test:integration
```

Nunca reutilize `DATABASE_URL`, `DIRECT_URL` ou `INTEGRATION_DATABASE_URL` de staging ou produção nesses comandos.

O procedimento unificado, os pisos de cobertura e o helper seguro para PowerShell estão em `docs/development/backend-regression.md`.

## Proteção da branch principal

Depois que o workflow executar ao menos uma vez no GitHub, configure uma ruleset para a branch `main`:

1. Abra **Settings → Rules → Rulesets** no repositório.
2. Crie ou edite a ruleset da branch `main`.
3. Exija pull request antes do merge.
4. Ative a exigência de status checks.
5. Selecione `Quality / API`, `Quality / Web` e `Quality / Deploy Gate` como checks obrigatórios.
6. Exija a branch atualizada antes do merge, aplique as regras também aos administradores e não
   permita bypass, force push ou exclusão da `main`.

Essa configuração no GitHub é necessária para impedir o merge de uma pull request quando qualquer um dos dois checks falhar.

Em 16/09/2026, após o proprietário tornar o repositório público, foi verificada e atualizada a ruleset
**Proteção da main** (ID `20473014`). Ela está ativa na branch padrão, exige PR, os três checks do
GitHub Actions e branch atualizada, proíbe force push e exclusão e não possui atores com bypass.
O novo Deploy Gate só terá resultado publicado após a primeira execução do workflow atualizado.

Repositórios privados em uma conta GitHub Free não oferecem proteção de branch. Nesse caso, manter
o repo privado exige GitHub Pro (ou um plano equivalente para organizações), ou uma decisão explícita
de tornar o repo público. Um check no workflow, sozinho, não bloqueia merge nem deploy.

## Gate dos builds de produção

A configuração dos provedores complementa a CI. O script `scripts/deploy/require-quality.mjs`
consulta a API do GitHub antes dos builds de produção e exige a execução de `Quality` originada por
push na `main` para o SHA exato fornecido pelo provedor. A aprovação do PR não substitui a execução
do commit de merge. O script não inicia deploys, não aplica migrations e não altera dados.

Somente a execução mais recente do workflow versionado e os jobs da tentativa atual são aceitos.
API, Web e Deploy Gate precisam estar presentes, concluídos e com `success`. Falha, cancelamento,
`skipped`, `neutral`, check ausente, branch/repositório incorretos ou indisponibilidade da consulta
bloqueiam o build. O script aguarda até 25 minutos, consultando a cada 45 segundos; se a CI demorar
mais, corrija a causa e repita o deploy depois da aprovação, sem remover o gate.

Como o repositório está público, a consulta não requer token. Se voltar a privado, configure
`DEPLOY_GITHUB_READ_TOKEN` somente nos builds de produção dos provedores, com acesso mínimo de
leitura de Actions ao repositório. Nunca use variável `NEXT_PUBLIC_*` nem compartilhe esse token
com previews. Rate limit ou erro HTTP bloqueiam o build, não são tratados como aprovação.

A infraestrutura transversal fica em `scripts/deploy`; os testes Node.js isolados ficam em
`tests/deploy`, fora dos módulos de negócio e do workspace de navegador. Eles não dependem de
credenciais, banco ou provedores e são executados pelo job da API:

```bash
pnpm test:deploy
```

### Render

No plano Free, o Blueprint usa `autoDeployTrigger: checksPass` e aplica migrations ao final do
build, após a compilação. Essa adaptação permite automatizar a publicação sem o comando pago
de pre-deploy. O `buildCommand` começa com:

```bash
node scripts/deploy/require-quality.mjs --provider render
```

A verificação usa `RENDER_GIT_REPO_SLUG`, `RENDER_GIT_BRANCH` e `RENDER_GIT_COMMIT`. Antes do merge:

1. revise as migrations e sua compatibilidade com a API ainda em produção;
2. confirme as validações do PR e faça merge na `main`;
3. aguarde o CI da `main`, o deploy automático e a aplicação das migrations;
4. valide health, readiness e os fluxos atingidos.

Depois de fazer merge desta configuração, sincronize o Blueprint e confirme que o Build Command
efetivo começa com o script e termina com `pnpm --filter @vavito/api prisma:migrate:deploy`.
Confirme também **After CI Checks Pass** no serviço. O modo nativo aceita `neutral` e `skipped`;
por isso mantemos a verificação mais estrita do script. Deploy manual também passa pelo gate.
Migrations aplicadas não são revertidas por falhas posteriores de deploy ou rollback de código;
consulte o [guia da API na Render](render-api.md) para a estratégia de compatibilidade.

### Vercel

Confirme `main` como **Production Branch**, acesso às System Environment Variables e inclusão dos
arquivos externos ao Root Directory `apps/web`. O arquivo `apps/web/vercel.json` define:

```bash
node ../../scripts/deploy/require-quality.mjs --provider vercel && pnpm build
```

Em Production, o gate usa `VERCEL_ENV`, os metadados do repositório, `VERCEL_GIT_COMMIT_REF` e
`VERCEL_GIT_COMMIT_SHA`. A atribuição automática de domínios pode permanecer ativa: o build só segue
após a aprovação do SHA na `main`. Isso evita depender de uma promoção manual para aguardar a CI.
Os comandos locais de build e os builds executados pelo GitHub não chamam esse preflight, evitando
que a CI espere sua própria conclusão.

Previews explicitamente identificados por `VERCEL_ENV=preview` continuam liberados para revisão,
sem gate de produção. Não use **Promote to Production** em builds de Preview: essa promoção reutiliza
um artefato que não passou pelo gate de Production. Para publicar, faça merge na main protegida e
use seu build de Production. A implementação não remove poderes administrativos de alterar
configurações, promover previews manualmente ou reativar artefatos antigos.

### Validação de aceitação

Em um PR de teste, confirme que uma falha de API ou Web produz Deploy Gate vermelho e impede o
merge quando a proteção estiver ativa. Confirme também que nenhum domínio de produção muda antes
da aprovação do SHA na `main`. Teste cancelamento e job ignorado: nenhum deles libera o gate.

Até publicar o workflow e as configurações, confirmar os comandos efetivos e validar o bloqueio
nos provedores, a Task 14.4 permanece em andamento. Não use previews para mutações reais se suas
variáveis ainda apontarem para API e Supabase de produção. Um administrador pode remover o gate;
a proteção se aplica ao fluxo configurado, não a operações que o contornem deliberadamente.

Referências: [proteção de branches no GitHub](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches),
[deploys na Render](https://render.com/docs/deploys) e
[ambientes e promoção na Vercel](https://vercel.com/docs/deployments/environments),
[variáveis da Render](https://render.com/docs/environment-variables),
[variáveis da Vercel](https://vercel.com/docs/environment-variables/system-environment-variables) e
[comando de build da Vercel](https://vercel.com/docs/project-configuration#buildcommand).

Os checks do GitHub são parte do congelamento, mas não substituem os smoke tests dos provedores no
ambiente de destino. A sequência completa de promoção e rollback está no
[runbook da release candidate](release-candidate.md).
