# Vavito Archives — Escopo funcional da V1

Status: **aprovado**

Este documento é a referência oficial do escopo funcional da primeira versão do Vavito Archives. Ele consolida o plano de execução e o guia de UI. Uma funcionalidade só é obrigatória na V1 quando aparece neste documento.

## Objetivo do produto

Entregar um blog pessoal completo no qual:

- visitantes descobrem, pesquisam e leem artigos;
- leitores criam conta para comentar, reagir e salvar artigos;
- o administrador produz, publica e administra conteúdo;
- visitantes podem assinar a newsletter e enviar mensagens de contato;
- a aplicação oferece uma experiência pública responsiva, acessível e adequada para indexação.

## Perfis de acesso

### Visitante

Pessoa não autenticada. Pode acessar conteúdo público, pesquisar artigos, compartilhar links, consultar comentários, enviar contato e iniciar ou cancelar uma assinatura da newsletter.

### Leitor

Usuário autenticado com a função `USER`. Possui todas as permissões do visitante e pode manter perfil, comentar, responder comentários, reagir e salvar artigos.

### Administrador

Usuário autenticado com a função `ADMIN`. Possui acesso ao painel editorial, publicação, mídia, moderação e newsletter. A V1 não oferece um endpoint público para promover usuários a administrador.

## Páginas e superfícies obrigatórias

### Área pública

| Página ou superfície | Rota | Conteúdo obrigatório |
| --- | --- | --- |
| Home | `/` | Apresentação, estatísticas, filtro por tag, artigos recentes, mais acessados e chamada da newsletter. |
| Artigos | `/artigos` | Listagem paginada de artigos publicados e filtro por tag. |
| Leitura | `/artigos/:slug` | Capa, conteúdo, metadados, progresso de leitura, compartilhamento, reações, comentários e artigos relacionados. |
| Sobre | `/sobre` | Apresentação do autor e propósito do projeto. |
| Contato | `/contato` | Formulário com nome, email e mensagem, incluindo validação e feedback de envio. |
| Privacidade | `/privacidade` | Informações sobre conta, comentários, newsletter, contato e tratamento de dados. |
| Autenticação | `/auth` | Cadastro, entrada, confirmação de email, recuperação e redefinição de senha. |
| Busca | Overlay global | Busca por título, resumo e tags, acessível por teclado e pelo atalho `Cmd/Ctrl+K`. |

Rotas técnicas de callback e redefinição de senha podem existir como subrotas de autenticação sem constituir novas funcionalidades de produto.

### Área autenticada do leitor

| Página ou superfície | Rota | Conteúdo obrigatório |
| --- | --- | --- |
| Perfil | `/perfil` | Visualização e alteração de nome e avatar, acesso aos fluxos de senha e exclusão de conta. |
| Salvos | `/salvos` | Biblioteca privada e paginada dos artigos salvos pelo leitor. |
| Comentários | Em `/artigos/:slug` | Criar comentário ou resposta, editar e excluir conteúdo próprio, com no máximo dois níveis de conversa. |
| Reações | Em `/artigos/:slug` | Marcar, trocar ou desfazer `LIKE` ou `DISLIKE` e visualizar os contadores. |
| Bookmark | Em `/artigos/:slug` | Salvar ou remover um artigo da biblioteca privada usando o mesmo controle. |

### Área administrativa

A área administrativa usa `/admin` e suas subrotas. Ela não utiliza o header e o footer públicos.

Funcionalidades obrigatórias:

- listar posts por estado;
- criar e editar rascunhos;
- editar título, slug, resumo, conteúdo, tags, capa e metadados de SEO;
- produzir conteúdo estruturado com Tiptap;
- salvar rascunhos automaticamente;
- visualizar preview protegido;
- publicar, despublicar, arquivar e restaurar posts;
- enviar imagens, exigir texto alternativo e inserir a mídia no editor;
- moderar comentários por aprovação, ocultação ou marcação como spam;
- consultar assinantes elegíveis;
- preparar, visualizar e enviar uma campanha de artigo uma única vez.

## Funcionalidades obrigatórias por capacidade

### Conteúdo e descoberta

- somente posts com estado `PUBLISHED` aparecem na área pública;
- cada post público possui slug único e URL canônica;
- listagens possuem paginação e ordenação estável;
- filtros por tag permanecem representados na URL;
- a busca usa PostgreSQL e limita a quantidade de resultados;
- a home exibe artigos recentes e ranking de mais acessados;
- a leitura suporta o JSON versionado produzido pelo Tiptap;
- sitemap, robots, Open Graph, canonical e metadados por artigo fazem parte da entrega.

### Conta e autorização

- Supabase Auth cuida de cadastro, login, confirmação de email e recuperação de senha;
- a API NestJS valida o JWT do Supabase;
- autorização administrativa usa a função persistida no `Profile`, sem confiar em metadados editáveis pelo cliente;
- um novo usuário recebe um `Profile` com função `USER`;
- exclusão de conta exige confirmação explícita e tratamento coerente dos dados associados.

### Comentários e engajamento

- a leitura de comentários é pública;
- criação, edição, exclusão, reação e bookmark exigem autenticação;
- quando um visitante tenta realizar uma ação protegida, a interface abre um modal explicando que é necessário entrar ou criar uma conta para continuar;
- o modal de autenticação possui uma ação principal para acessar `/auth` e uma ação secundária para cancelar e permanecer no artigo;
- o fluxo de autenticação preserva a URL do artigo para retornar o leitor ao contexto original;
- um leitor só altera seu próprio comentário, salvo intervenção administrativa;
- um comentário editado exibe o texto sutil `editado` abaixo do conteúdo;
- conversas possuem no máximo dois níveis: comentário principal e respostas diretas;
- uma resposta sempre pertence ao mesmo artigo e aponta para um comentário principal;
- respostas não podem receber respostas aninhadas adicionais na V1;
- exclusão de comentário preserva a consistência da conversa por soft delete;
- existe no máximo uma reação e um bookmark por combinação de leitor e artigo;
- clicar novamente na reação ativa desfaz a reação;
- clicar em outra reação troca o tipo atual sem criar um segundo registro;
- clicar novamente no bookmark ativo remove o artigo da biblioteca;
- repetir uma ação idempotente não cria registros duplicados.

### Newsletter e contato

- inscrição na newsletter registra consentimento;
- confirmação e cancelamento funcionam por links reais;
- respostas de inscrição não revelam se um email já está cadastrado;
- emails de autenticação e aplicação usam Resend;
- uma campanha possui proteção contra envio duplicado e link de cancelamento;
- o contato aplica validação e proteção básica contra abuso;
- mensagens de contato são armazenadas e notificam o administrador.

### Notificações

Notificação em tempo real significa atualização entregue por canal persistente ou push, como WebSocket, Server-Sent Events, notificação do navegador ou central interna atualizada instantaneamente. Essa infraestrutura não faz parte da V1.

A ausência de tempo real não impede emails transacionais:

- uma mensagem de contato aceita pela API envia email ao administrador logo após o processamento;
- um comentário novo aceito pela API envia email ao administrador logo após ser persistido;
- o email de novo comentário contém apenas título do artigo, nome público do leitor, trecho seguro do comentário e link para a moderação;
- falha no envio do email é registrada e pode usar retry limitado, mas não desfaz o comentário já persistido;
- a publicação de um artigo não envia uma notificação ao próprio administrador;
- leitores só recebem o artigo quando o administrador prepara e envia uma campanha de newsletter;
- comentários novos também aparecem na área administrativa e na fila de moderação.

### Mídia

- imagens públicas ficam no Supabase Storage;
- uploads administrativos validam tamanho, tipo real do arquivo e extensão;
- texto alternativo é obrigatório;
- banco e Storage mantêm estados coerentes quando um upload falha;
- existe um processo seguro, com modo de simulação, para identificar e remover mídia órfã.

## Requisitos de experiência e qualidade

- identidade visual `Minimal Mono`, inicialmente em tema escuro;
- layout mobile-first e responsivo;
- largura de leitura de 640 px em telas compatíveis;
- navegação completa por teclado nas superfícies críticas;
- foco visível e contrastante em controles interativos;
- estados de carregamento, vazio, erro e sucesso nas experiências assíncronas;
- testes unitários, de integração e E2E fazem parte das tasks correspondentes;
- lint, format, typecheck, testes e builds são gates obrigatórios da CI;
- logs não expõem tokens, senhas ou chaves;
- CORS, rate limiting, limites de payload e validação de upload são obrigatórios;
- health check e smoke tests fazem parte do go-live.

## Decisões técnicas que delimitam a V1

- monorepo com `pnpm workspaces` e Turborepo;
- frontend Next.js em `apps/web`;
- API NestJS em `apps/api`;
- Prisma e migrations em `apps/api/prisma`;
- PostgreSQL, Auth e Storage no Supabase;
- conteúdo Tiptap persistido como JSONB versionado;
- comunicação do frontend com regras de negócio exclusivamente pela API;
- contrato compartilhado por OpenAPI e `packages/api-client`;
- Render para a API e Vercel para o frontend.

## Fora da V1

Os seguintes itens não fazem parte da entrega obrigatória:

- microserviços;
- GraphQL;
- Redis;
- filas distribuídas;
- CQRS;
- event sourcing;
- editor colaborativo;
- aplicativo mobile nativo;
- mecanismo externo de busca, como Elasticsearch;
- múltiplos temas ou tema claro;
- autenticação social;
- múltiplos autores ou painel de gestão de equipe;
- agendamento de publicação;
- notificações em tempo real;
- analytics avançado;
- internacionalização;
- comentários com mais de dois níveis de profundidade.

Itens fora da V1 podem ser registrados no backlog futuro, mas não podem bloquear o lançamento nem entrar implicitamente em uma task existente.

## Critérios de aceitação do escopo

O escopo está aprovado quando:

- todas as páginas públicas e privadas estão listadas;
- cada capacidade obrigatória possui limite verificável;
- os três perfis de acesso estão claros;
- itens fora da V1 estão explícitos;
- o plano técnico e o guia de UI não prometem funcionalidade conflitante;
- qualquer nova funcionalidade exige alteração deste documento e revisão do backlog.

## Referências

- `docs_personal/plano_execucao_vavito_archives.html`
- `docs_personal/vavito-archives_guia-ui.html`
- Notion: `Vavito Archives - Scrum/Kanban`
