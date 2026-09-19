# Performance do frontend

As páginas públicas priorizam conteúdo visível no primeiro carregamento, estabilidade visual e
feedback consistente. As decisões abaixo são parte da arquitetura do frontend e devem ser
reutilizadas por novos componentes, sem depender de uma revisão manual do guia de UI.

## Imagens

- uploads editoriais e avatares são otimizados pela API antes do armazenamento;
- capas, imagens do conteúdo, previews administrativos e avatares usam `next/image`;
- `ProgressiveImage` reserva o espaço final, exibe o feixe vertical do design system durante o
  carregamento e faz a imagem aparecer suavemente quando estiver pronta;
- falhas de carregamento também encerram o estado animado, evitando skeleton infinito;
- imagens acima da dobra podem usar `preload`; as demais permanecem sob carregamento tardio do
  Next.js;
- novas imagens remotas devem ser adicionadas com origem exata em `next.config.ts`, nunca com um
  padrão global permissivo.

O componente compartilhado está em
`apps/web/src/components/feedback/progressive-image.tsx`. Imagens visíveis da interface não devem
implementar skeleton próprio nem usar `<img>` diretamente sem uma justificativa técnica.

## Fontes e conteúdo principal

A fonte Inter gerada pelo Next.js usa `display: optional`, evitando que uma troca tardia atrase o
maior conteúdo da página. A JetBrains Mono usada nos metadados é pré-carregada com `display: swap`
para que data, tempo de leitura e visualizações mantenham a mesma tipografia durante a navegação.

`RouteMotion` continua aplicando a sequência padrão de entrada, mas o primeiro bloco de conteúdo de
cada região semântica fica visível imediatamente. Assim, títulos e resumos principais não esperam
uma animação para serem apresentados, enquanto cards e elementos secundários preservam o movimento
progressivo do site.

## Carregamento da página do artigo

A rota do artigo e sua metadata consultam somente o detalhe necessário à leitura. O detalhe público
usa o cliente com cache do `fetch` do Next.js por 30 segundos; o estado personalizado do leitor
(reação e artigo salvo) é resolvido em um Server Component separado, sem bloquear a resposta
principal. Comentários, perfil do leitor e artigos relacionados carregam em Server Components
separados por `Suspense`, com skeletons próprios. Essas consultas não bloqueiam a entrega de título,
resumo, capa e conteúdo. Falhas nas recomendações apresentam feedback local e não impedem a leitura.

A capa mantém `preload` e não espera hidratação para ficar visível. A redução do LCP deve ser
confirmada após o deploy com medições reais; latência da API e download da imagem ainda participam
do carregamento principal.

## Carregamento da Home e da listagem

Home e `/artigos` entregam primeiro o cabeçalho e a estrutura principal. Tópicos, cards, métricas e
paginação são Server Components separados por `Suspense`, com skeletons que preservam o espaço
visual e erros isolados por região. Assim, a latência do Render em uma consulta secundária não
impede o navegador de pintar o título e os controles acima da dobra.

Na Home, cada consulta também deve ser iniciada dentro do Server Component protegido pela sua
própria fronteira de `Suspense`. Iniciar essas promessas no componente pai faz a resposta aguardar o
conteúdo secundário antes de liberar o hero, mesmo quando os resultados são consumidos mais abaixo.

As consultas públicas dessas duas rotas usam o cache do `fetch` do Next.js por 30 segundos, com a
tag `public-content`. Ações administrativas que publicam, arquivam, excluem artigos ou alteram a
visibilidade de tópicos invalidam essa tag e as rotas públicas. Dados autenticados, comentários e
rascunhos continuam fora desse cache.

## Limites de componentes no cliente

`page.tsx` e `layout.tsx` permanecem Server Components. A diretiva `use client` fica restrita às
fronteiras que realmente possuem estado, eventos do navegador ou integrações interativas. Recursos
pequenos não devem adicionar um provider global: a busca, por exemplo, mantém debounce e
cancelamento dentro do próprio hook para não enviar uma biblioteca de cache a todas as páginas.

Dependências pesadas acionadas pela navegação global também ficam fora do carregamento inicial. O
SDK do Supabase usado para consultar a sessão mobile e encerrar uma sessão é importado somente
quando o usuário inicia a ação. Links globais para a autenticação desabilitam o prefetch automático,
pois antecipar toda a tela de cadastro na Home aumenta o trabalho da thread principal sem ajudar a
leitura do conteúdo atual.

Na navegação mobile, o botão de busca permanece leve no HTML inicial; o diálogo, a consulta e a
lista de resultados entram em um chunk sob demanda quando a busca é aberta. O diálogo de acesso aos
artigos salvos segue a mesma regra e só carrega após uma tentativa de abrir a área protegida. Essas
fronteiras não alteram o layout nem a interação no desktop e evitam que bibliotecas de diálogo e
resultados concorram com o título principal no primeiro paint móvel.

## Auditoria automatizada

Execute na raiz:

```powershell
pnpm test:performance:web
```

O comando cria uma build de produção, inicia uma API pública de fixture e audita três vezes a home,
a listagem de artigos e um artigo completo. O Lighthouse aplica a limitação móvel diretamente no
navegador; a melhor medição das três execuções reduz variações entre runners e precisa atender:

| Métrica | Meta |
| --- | ---: |
| Performance | 85 ou mais |
| Acessibilidade | 95 ou mais |
| Boas práticas | 90 ou mais |
| SEO | 90 ou mais |
| LCP | até 2,5 s |
| CLS | até 0,1 |
| TBT | até 600 ms |
| Transferência total | até 1 MB |

Os relatórios locais ficam em `tests/e2e/.lighthouseci/reports` e não são versionados. O mesmo
comando é executado pelo workflow de qualidade depois da build do frontend.
