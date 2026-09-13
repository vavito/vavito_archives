# Changelog

As mudanças relevantes do Vavito Archives são registradas neste arquivo. O projeto segue
[Versionamento Semântico](https://semver.org/lang/pt-BR/) durante a preparação da V1.

## [0.1.0-rc.2] - 2026-09-13

### Adicionado

- experiência pública completa para descoberta, busca, leitura e compartilhamento de artigos;
- cadastro, confirmação de email, recuperação de senha, perfil, comentários, reactions e artigos
  salvos;
- painel administrativo com editor rico, capas e imagens, preview protegido, publicação,
  despublicação, arquivamento, revisões e exclusão permanente;
- moderação de comentários e campanhas de newsletter com até cinco artigos;
- identidade visual oficial e templates consistentes para emails editoriais, transacionais e de
  autenticação;
- jornadas E2E públicas, autenticadas e administrativas, auditorias WCAG, orçamento Lighthouse e
  matriz automatizada de segurança e privacidade.

### Alterado

- uploads de avatar, capa e conteúdo passam por otimização e conversão para WebP antes do
  armazenamento;
- imagens da interface usam carregamento progressivo compartilhado e dimensões responsivas;
- artigos publicados preservam uma versão pública estável enquanto alterações posteriores ficam
  pendentes até nova publicação;
- cache e revalidation foram alinhados aos eventos editoriais e às páginas públicas;
- o SDK de autenticação e a rota de login deixam de ser antecipados na navegação global e só são
  carregados quando o visitante inicia uma ação autenticada;
- emails com um artigo entregam o conteúdo completo; campanhas com vários artigos usam previews
  padronizados.

### Corrigido

- fluxos de confirmação e recuperação respeitam a origem pública usada pelo visitante;
- cadastro informa quando o email já pertence a uma conta e o envio de boas-vindas é resiliente e
  idempotente;
- layout, contraste, foco, animações, capas e navegação responsiva foram estabilizados nas páginas
  públicas e administrativas;
- busca, comentários extensos, artigos relacionados e enquadramento de capas foram ajustados para
  desktop e mobile.

### Segurança

- validação de ambiente de produção exige HTTPS, origins CORS exatas, segredos distintos e ausência
  de placeholders;
- CI bloqueia segredos versionados e vulnerabilidades de produção de severidade alta ou crítica;
- matriz de autorização cobre perfis, mídia, conteúdo administrativo, comentários e exclusão de
  conta.

### Limitações conhecidas

Consulte a seção [Limitações conhecidas](docs/development/release-candidate.md#limitações-conhecidas)
do runbook antes do deploy.

## [0.1.0-rc.1] - 2026-08-28

- primeira release candidate da API, com regressão automatizada, cobertura mínima e hardening do
  backend;
- tag preservada como marco histórico da Sprint 8.

[0.1.0-rc.2]: https://github.com/vavito/vavito_archives/compare/v0.1.0-rc.1...v0.1.0-rc.2
[0.1.0-rc.1]: https://github.com/vavito/vavito_archives/releases/tag/v0.1.0-rc.1
