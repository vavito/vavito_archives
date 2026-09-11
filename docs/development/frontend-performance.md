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

## Limites de componentes no cliente

`page.tsx` e `layout.tsx` permanecem Server Components. A diretiva `use client` fica restrita às
fronteiras que realmente possuem estado, eventos do navegador ou integrações interativas. Recursos
pequenos não devem adicionar um provider global: a busca, por exemplo, mantém debounce e
cancelamento dentro do próprio hook para não enviar uma biblioteca de cache a todas as páginas.

## Auditoria automatizada

Execute na raiz:

```powershell
pnpm test:performance:web
```

O comando cria uma build de produção, inicia uma API pública de fixture e audita duas vezes a home,
a listagem de artigos e um artigo completo. O Lighthouse aplica diretamente sua limitação móvel de
CPU e rede; a melhor medição das duas execuções precisa atender:

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
