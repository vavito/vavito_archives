# Jornadas E2E full stack

A Task 13.1 reúne os caminhos críticos do navegador em um único comando reproduzível:

```bash
pnpm test:e2e:full-stack
```

O comando executa as suítes pública, autenticada e administrativa em sequência. Essa ordem é
intencional: todas usam o diretório `.next-e2e` e cada uma inicia e encerra os próprios processos,
sem depender de servidores já abertos ou das portas usadas no desenvolvimento.

## Jornadas cobertas

- visitante navega, busca, filtra e lê artigos, além de validar erros e responsividade;
- leitor cria a conta, confirma o cadastro, recebe uma sessão, entra na newsletter e publica um
  comentário;
- leitor edita perfil, comentários, reactions, salvos e senha, incluindo logout global;
- visitante solicita, confirma e cancela uma inscrição na newsletter;
- visitante envia uma mensagem de contato e recebe a confirmação da aplicação;
- administrador cria um rascunho, formata o conteúdo, salva, envia uma capa, revisa o preview e
  publica o artigo.

## Isolamento

As jornadas usam Next.js, Supabase SDK, cookies, Server Actions e componentes reais. Os contratos
de Auth, API e mídia são atendidos por servidores locais descartáveis em `tests/e2e/support`. Os
endpoints `__test` expõem somente o estado necessário para confirmar efeitos que normalmente seriam
observados por email ou banco e nunca são incluídos na aplicação.

Essa suíte não substitui a integração da API com PostgreSQL, os testes dos provedores nem os smoke
tests do ambiente publicado. A persistência real permanece coberta pela regressão da API; Supabase,
Storage e Resend serão verificados no ambiente apropriado sem colocar credenciais reais no
Playwright.

## Acessibilidade

A suíte também executa auditorias WCAG A e AA com Axe nas superfícies críticas da busca, do editor
e da navegação mobile. Os cenários confirmam ausência de violações automatizáveis, contraste,
rótulos e anúncios semânticos, foco visível e os caminhos essenciais por teclado.

Para executar somente essa revisão:

```bash
pnpm test:e2e:a11y
```

A auditoria automatizada complementa, mas não substitui, a revisão manual com teclado e tecnologia
assistiva. Os testes de acessibilidade também fazem parte das suítes pública e administrativa e,
portanto, continuam protegidos por `pnpm test:e2e:full-stack` na CI.

## Execução local e CI

Na primeira execução, instale os navegadores administrados pelo Playwright:

```bash
pnpm --filter @vavito/e2e exec playwright install chromium webkit
```

Depois, execute `pnpm test:e2e:full-stack` pela raiz. A CI usa o mesmo comando no job
`Quality / Web`. Falhas preservam screenshots e traces em `tests/e2e/test-results`.
