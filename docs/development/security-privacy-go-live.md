# Revisão de segurança e privacidade para go-live

Este documento consolida a matriz executável da V1. Ele complementa os guias específicos de
autenticação, segurança HTTP, mídia, perfis e newsletter; não substitui uma avaliação jurídica do
tratamento realizado pelo produto.

A referência externa adotada para o baseline é o
[guia de segurança da informação da ANPD para agentes de pequeno porte](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-sobre-seguranca-da-informacao-para-agentes-de-tratamento-de-pequeno-porte),
que reúne medidas técnicas, administrativas e um checklist de proteção de dados. A base legal e os
direitos dos titulares permanecem definidos pela
[Lei Geral de Proteção de Dados Pessoais](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm).

## Resultado da revisão de 12 de setembro de 2026

- a auditoria de dependências não encontra vulnerabilidades conhecidas após as atualizações e
  overrides registrados no lockfile;
- o repositório não contém arquivo de ambiente versionado, credencial reconhecida pelo scanner ou
  referência a segredos server-only no código entregue ao navegador;
- ambientes de produção exigem HTTPS nas URLs públicas, segredos internos distintos e rejeitam
  placeholders comuns;
- a matriz focada de autenticação, autorização, CORS, rate limit, uploads, exclusão e consentimento
  possui testes automatizados;
- o cadastro informa de forma visível a entrada automática na newsletter e aponta para a página de
  privacidade, que também registra esse comportamento e o cancelamento disponível.

## Matriz automatizada

| Área | Cenário obrigatório | Evidência principal |
| --- | --- | --- |
| Auth | visitante recebe `401` nas rotas protegidas | `test/e2e/auth/supabase-auth.guard.e2e-spec.ts` e `test/e2e/profiles/profiles.e2e-spec.ts` |
| Roles | perfil `USER` recebe `403` e `ADMIN` acessa rotas administrativas | `test/e2e/auth/supabase-auth.guard.e2e-spec.ts`, `test/e2e/posts/posts.e2e-spec.ts` e `test/e2e/media/media.e2e-spec.ts` |
| Autoria | um leitor não edita nem exclui conteúdo de outro perfil | `test/e2e/comments/comments-authorization.e2e-spec.ts` |
| CORS | somente origins exatas recebem headers, inclusive no preflight | `test/e2e/http/security.e2e-spec.ts` |
| Payload | JSON acima de 1 MiB retorna `413` no contrato global | `test/e2e/http/security.e2e-spec.ts` |
| Rate limit | operações públicas sensíveis retornam `429` e `Retry-After` após o limite | `test/e2e/contact/contact.e2e-spec.ts` e `test/e2e/newsletter/newsletter.e2e-spec.ts` |
| Upload | somente `ADMIN` envia mídia; bytes, MIME, extensão, tamanho e alt text são validados | `test/e2e/media/media.e2e-spec.ts` |
| Exclusão | a conta exige autenticação e a frase de confirmação exata | `test/e2e/profiles/profiles.e2e-spec.ts` |
| Newsletter | inscrição, confirmação e cancelamento são públicos; vínculo da conta exige JWT | `test/e2e/newsletter/newsletter.e2e-spec.ts` |
| Segredos | scanner impede `.env`, chaves reconhecíveis e referências client-side indevidas | `scripts/security/check-repository-secrets.mjs` |
| Dependências | vulnerabilidade `high` ou `critical` interrompe o check | `pnpm security:check` e `.github/workflows/quality.yml` |

Execute a matriz focada da API e o baseline do repositório pela raiz:

```bash
pnpm security:check
pnpm test:security:api
```

A regressão completa continua obrigatória antes do merge porque valida também persistência,
contratos e jornadas de navegador:

```bash
pnpm test:regression:api
pnpm test:e2e:full-stack
```

## Checklist por ambiente

Antes de promover preview ou produção, confirme todos os itens no ambiente de destino:

- `FRONTEND_URL`, `SUPABASE_URL` e todas as origins de CORS usam HTTPS e não têm curingas;
- cada preview temporário é removido de `CORS_ALLOWED_ORIGINS` quando deixa de ser necessário;
- service role, credenciais do Resend e segredos HMAC existem somente no cofre do servidor;
- `NEWSLETTER_TOKEN_SECRET`, `REVALIDATION_SECRET` e `VIEW_FINGERPRINT_SECRET` são longos,
  distintos e possuem plano de rotação;
- o Swagger permanece desabilitado em produção;
- a API opera em uma única instância enquanto o rate limit estiver em memória; múltiplas réplicas
  exigem armazenamento distribuído ou proteção equivalente no gateway;
- buckets de avatar e mídia pertencem ao ambiente correto, permitem leitura prevista e recusam
  escrita com chave pública;
- uploads inválidos e acima do limite são rejeitados, e a rotina de órfãos foi executada primeiro em
  dry run;
- confirmação de conta, recuperação de senha, confirmação e cancelamento da newsletter apontam
  para a URL pública correta;
- a página de privacidade corresponde aos dados e provedores efetivamente usados, e o contato para
  solicitações do titular está operacional;
- logs e alertas não incluem token, email, corpo de upload ou resposta bruta dos provedores;
- backup, restauração e resposta a incidentes foram verificados com os responsáveis pela
  infraestrutura.

## Critério de bloqueio

O go-live deve ser interrompido quando houver vulnerabilidade conhecida `high` ou `critical`, segredo
versionado, CORS curinga, escrita pública nos buckets, rota administrativa acessível por `USER`, fluxo
de exclusão sem confirmação ou comunicação de newsletter sem informação e cancelamento disponíveis.
Uma exceção precisa ter responsável, prazo e mitigação registrados antes da liberação.
