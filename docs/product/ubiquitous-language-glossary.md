# Vavito Archives — Glossário da Linguagem Ubíqua

Status: **aprovado**

Este glossário define os termos canônicos compartilhados entre produto, interface, documentação, domínio, API, banco, testes e conversas técnicas. Quando houver diferença entre o texto exibido ao usuário e o nome usado no código, o mapeamento deve permanecer explícito.

## Regras de uso

- Textos da interface usam português natural; código, DTOs e nomes de tabelas/modelos usam inglês.
- Um conceito possui um nome canônico por camada, documentado neste arquivo.
- Estados usam `UPPER_SNAKE_CASE`; modelos e DTOs usam `PascalCase`; campos e métodos usam `camelCase`.
- Métodos de domínio usam verbos de negócio, como `publish()` e `markAsSpam()`, nunca `updateStatus()`.
- Termos técnicos não substituem conceitos do negócio. Por exemplo, “atualizar a row” não substitui “publicar o post”.
- Quando “usuário”, “notificação”, “exclusão”, “envio” ou “status” puderem significar mais de uma coisa, deve-se usar o termo específico deste glossário.
- Alteração de termo canônico exige atualização deste arquivo, dos contratos afetados e do backlog.

## Pessoas, identidade e acesso

| Termo no produto | Nome canônico no código | Definição |
| --- | --- | --- |
| Visitante | `Visitor` como persona, sem entidade | Pessoa sem sessão autenticada. Pode consumir conteúdo público, enviar contato e usar newsletter. |
| Leitor | `Reader` como persona | Pessoa autenticada com `Profile.role = USER`. Não existe tabela `Reader`. |
| Administrador | `Admin` como persona | Pessoa autenticada com `Profile.role = ADMIN`. |
| Identidade de autenticação | Supabase `auth.users` | Conta, email, senha, confirmação e sessão administrados pelo Supabase Auth. |
| Usuário autenticado da requisição | `AuthenticatedUser` | Representação segura do JWT validado usada por guards/controllers. Não é entidade de domínio. |
| Perfil | `Profile` | Registro local da aplicação ligado ao UUID do Supabase Auth; contém nome público, avatar, role e exclusão lógica. |
| Função | `UserRole` | Nível persistido de autorização: `USER` ou `ADMIN`. |
| Autor | `Author` como papel | Profile responsável por um post ou comentário. Não cria uma tabela separada. |

### Regra contra “User” ambíguo

Evitar `User` como nome de entidade local. Usar:

- `AuthenticatedUser` para o principal da requisição;
- `Profile` para os dados da aplicação;
- `Reader` ou `Admin` ao falar da persona;
- `auth.users` ao falar da identidade do Supabase.

## Conteúdo editorial

| Termo no produto | Nome canônico no código | Definição |
| --- | --- | --- |
| Artigo | `Post` | Conteúdo editorial autoral. A interface diz “artigo”; domínio, API e persistência usam `Post`. |
| Rascunho | `PostStatus.DRAFT` | Estado editável ainda não público. Não existe entidade `Draft`. |
| Artigo publicado | `PostStatus.PUBLISHED` | Post público, editável com revisão e disponível pelo slug atual. |
| Artigo arquivado | `PostStatus.ARCHIVED` | Post retirado da área pública e não editável até restauração. |
| Publicação | `publish()` | Transição de `DRAFT` para `PUBLISHED` após validação completa. |
| Despublicação | `unpublish()` | Transição de `PUBLISHED` para `DRAFT`. |
| Arquivamento | `archive()` | Transição de `DRAFT` ou `PUBLISHED` para `ARCHIVED`. |
| Restauração como rascunho | `restoreAsDraft()` | Transição de `ARCHIVED` para `DRAFT`. |
| Edição de post | `edit()` | Alteração de campos editoriais. Em post publicado, cria uma revisão anterior. |
| Revisão editorial | `PostRevision` | Snapshot administrativo da versão anterior de um post publicado, com editor, versão e data. |
| Slug | `PostSlug.slug` | Segmento normalizado usado na URL do artigo. É único entre slugs atuais e históricos. |
| Slug atual | `PostSlug.isCurrent = true` | Slug que forma a URL canônica atual do post. |
| Slug histórico | `PostSlug.isCurrent = false` | Slug antigo que redireciona permanentemente para o atual. |
| URL canônica | `canonicalUrl` | Endereço público preferencial do post para navegação e SEO. |
| Resumo | `excerpt` | Texto curto usado em cards, busca e metadados. Não usar `summary` para este campo. |
| Conteúdo do post | `content` | Documento estruturado produzido pelo Tiptap e persistido como JSONB. |
| Versão do conteúdo | `contentSchemaVersion` | Versão da estrutura do documento Tiptap, não versão editorial do post. |
| Tempo de leitura | `readingTimeMinutes` | Estimativa calculada pelo backend, em minutos. |
| Total de visualizações | `viewsCount` | Contador público consolidado do post. |
| Registro técnico de visualização | `PostView` | Dado interno temporário usado para deduplicação diária; retido por 30 dias. |
| Tag | `Tag` | Classificação reutilizável de posts, identificada por nome e slug. |
| Associação post-tag | `PostTag` | Relação entre Post e Tag; não é conceito exibido ao usuário. |

### Tiptap e JSONB

- `Tiptap` é o editor usado pelo administrador.
- `content` é o documento JSON produzido pelo editor.
- `JSONB` é o tipo de armazenamento PostgreSQL desse documento.
- O frontend renderiza o documento; o leitor nunca vê o JSON.
- `contentSchemaVersion` controla compatibilidade estrutural.
- `PostRevision.version` controla a sequência de revisões editoriais. Os dois tipos de versão não são equivalentes.

## Comentários e engajamento

| Termo no produto | Nome canônico no código | Definição |
| --- | --- | --- |
| Comentário | `Comment` | Mensagem de um leitor em um post. Pode ser principal ou resposta. |
| Comentário principal | `Comment` com `parentId = null` | Primeiro nível da conversa. |
| Resposta | `Comment` com `parentId` | Segundo e último nível; aponta para comentário principal do mesmo post. Não existe entidade `Reply`. |
| Comentário visível | `CommentStatus.VISIBLE` | Comentário publicado imediatamente e exibido no artigo. |
| Comentário oculto | `CommentStatus.HIDDEN` | Comentário removido da exibição por moderação. |
| Spam | `CommentStatus.SPAM` | Comentário classificado como abuso ou conteúdo indesejado. |
| Comentário excluído | `CommentStatus.DELETED` | Soft delete que preserva a conversa e pode mostrar placeholder. |
| Moderação | `Moderation` como capacidade | Ação administrativa posterior à publicação para ocultar, marcar spam ou restaurar. |
| Restaurar comentário | `approve()` | Retorna comentário `HIDDEN` ou `SPAM` a `VISIBLE`. Não significa aprovação prévia de comentário novo. |
| Editar comentário | `edit()` | Autor altera o próprio conteúdo; define `editedAt` e exibe “editado”. |
| Excluir comentário | `softDelete()` | Autor ou admin transforma o comentário em `DELETED`; não remove a linha. |
| Reação | `Reaction` | Escolha `LIKE` ou `DISLIKE` de um Profile sobre um Post. |
| Curtir | `ReactionType.LIKE` | Tipo positivo de Reaction. |
| Não curtir | `ReactionType.DISLIKE` | Tipo negativo de Reaction. |
| Artigo salvo | `Bookmark` | Vínculo privado entre Profile e Post. A interface pode dizer “salvar”. |
| Engajamento | `Engagement` | Nome do módulo que reúne Reaction e Bookmark; não é uma entidade. |

### Ações de engajamento

- `setReaction(type)` cria ou troca a reação atual.
- `removeReaction()` desfaz a reação.
- `addBookmark()` salva o post de forma idempotente.
- `removeBookmark()` remove o post dos salvos.
- “Toggle” descreve o comportamento da interface, não o nome do caso de uso do domínio.

## Mídia e Storage

| Termo no produto | Nome canônico no código | Definição |
| --- | --- | --- |
| Mídia editorial | `MediaAsset` | Registro que representa uma imagem ou arquivo editorial no Storage. |
| Associação de mídia | `PostMediaAsset` | Relação reutilizável entre Post e MediaAsset. |
| Capa | `MediaUsageType.COVER` | Uso de uma mídia como capa; há no máximo uma por post. |
| Mídia de conteúdo | `MediaUsageType.CONTENT` | Mídia usada dentro do documento do post. |
| Avatar | `Profile.avatarPath` | Imagem do perfil com fluxo próprio; não é MediaAsset editorial. |
| Path de Storage | `storagePath` | Identificador persistido do objeto. A URL pública é derivada e não é a fonte de verdade. |
| Texto alternativo | `altText` | Descrição acessível obrigatória da mídia editorial. |
| Mídia pronta | `MediaAssetStatus.READY` | Objeto validado e disponível para associação. |
| Mídia órfã | `MediaAssetStatus.ORPHANED` | Objeto sem associação a qualquer post após período seguro. |
| Limpeza definitiva | `purge()` | Remoção física após dry run e nova verificação de referências. |

### Ações de mídia

`create()`, `markReady()`, `markFailed()`, `retryUpload()`, `markOrphaned()`, `restoreReference()` e `purge()` são os verbos canônicos do ciclo de vida.

## Newsletter e email

| Termo no produto | Nome canônico no código | Definição |
| --- | --- | --- |
| Assinante | domínio `Subscriber`; Prisma `NewsletterSubscriber` | Email com consentimento independente de possuir conta no site. |
| Inscrição | `subscribe()` | Registra email, consentimento e token para double opt-in. |
| Double opt-in | confirmação em duas etapas | Inscrição só fica ativa depois que o titular confirma o link recebido. |
| Consentimento | `consentSource`, `consentedAt` | Origem e momento em que a pessoa solicitou inscrição. |
| Assinante pendente | `SubscriberStatus.PENDING` | Aguarda confirmação do email. |
| Assinante confirmado | `SubscriberStatus.CONFIRMED` | Elegível para campanhas. |
| Cancelado | `SubscriberStatus.UNSUBSCRIBED` | Titular cancelou a inscrição. |
| Bounce permanente | `SubscriberStatus.BOUNCED` | Servidor destinatário rejeitou definitivamente o endereço. |
| Reclamação de spam | `SubscriberStatus.COMPLAINED` | Provedor comunicou que o destinatário marcou o email como spam. |
| Supressão | `suppression` | Bloqueio de novos envios por bounce, complaint ou decisão do provedor. Não é cancelamento voluntário. |
| Campanha | `EmailCampaign` | Envio editorial de um post para audiência confirmada. |
| Rascunho de campanha | `CampaignStatus.DRAFT` | Campanha editável ainda não iniciada. |
| Campanha em envio | `CampaignStatus.SENDING` | Solicitação de envio em processamento. |
| Campanha enviada | `CampaignStatus.SENT` | Resend aceitou o envio; não garante entrega individual. |
| Campanha com falha | `CampaignStatus.FAILED` | Provedor não aceitou o envio global. |
| Entrega individual | `EmailDelivery` | Estado do email de uma campanha para um assinante específico. |
| Evento do provedor | `WebhookEvent` | Evento assinado e idempotente recebido do Resend. |
| Webhook | webhook HTTPS | Requisição enviada pelo Resend para informar evento; não é consulta periódica da nossa API. |
| Falha temporária | `EmailDeliveryStatus.DELIVERY_DELAYED` | Atraso como caixa cheia ou servidor indisponível; não bloqueia o assinante. |

### Ações de Subscriber

`subscribe()`, `confirm()`, `unsubscribe()`, `resubscribe()`, `markBounced()` e `markComplained()`.

### Ações de EmailCampaign

`create()`, `updateContent()`, `startSending()`, `markSent()`, `markFailed()` e `retry()`.

## Contato e notificações

| Termo no produto | Nome canônico no código | Definição |
| --- | --- | --- |
| Mensagem de contato | `ContactMessage` | Formulário validado e persistido antes da solicitação de email ao administrador. |
| Mensagem recebida | `ContactMessageStatus.RECEIVED` | Estado inicial após persistência. |
| Mensagem lida | `ContactMessageStatus.READ` | Administrador registrou leitura. |
| Mensagem arquivada | `ContactMessageStatus.ARCHIVED` | Retirada da caixa operacional sem exclusão física imediata. |
| Email transacional | `TransactionalEmail` como conceito | Email disparado em resposta a comentário, contato, autenticação ou confirmação. |
| Notificação em tempo real | `RealtimeNotification` como conceito futuro | WebSocket, SSE, push ou central instantânea; está fora da V1. |

Nunca escrever apenas “notificação” quando o requisito for especificamente “email transacional” ou “notificação em tempo real”.

## API e persistência

| Termo | Nome canônico | Definição |
| --- | --- | --- |
| Contrato da API | OpenAPI + `api-contract-v1.md` | Fonte compartilhada de rotas, DTOs e erros. |
| Cliente da API | `packages/api-client` | Pacote interno gerado/tipado usado pelo frontend para chamar a API. |
| DTO de entrada | `*RequestDto`, `Create*Dto`, `Update*Dto` | Estrutura validada recebida pela API. Não é entidade. |
| DTO de resposta | `*ResponseDto` | Estrutura pública ou administrativa retornada pela API. |
| Entidade | `domain/entities` | Objeto com comportamento e invariantes; não depende de Prisma ou HTTP. |
| Modelo Prisma | model de persistência | Representação das tabelas. Pode ter nome mais explícito que a entidade quando documentado. |
| Repository | `*Repository` | Contrato/implementação de persistência; não decide regra de negócio. |
| Service | `*Service` | Orquestra autorização, entidade, repository, transação e integrações. |
| Mapper | `*Mapper` | Converte modelo Prisma, entidade e DTO sem consultar banco. |
| Soft delete | estado + `deletedAt` | Exclusão lógica que preserva linha e relacionamentos. |
| Arquivamento | estado de negócio | Retira recurso do fluxo comum sem equivaler sempre a soft delete. |
| Purge | exclusão física | Remoção definitiva, controlada e auditada. |
| Idempotência | mesma intenção, mesmo efeito | Repetir a operação não duplica reação, bookmark, envio ou webhook. |
| Unique constraint | constraint de unicidade | Proteção do banco contra duplicidade, inclusive sob concorrência. |
| Prefixo da API | `/api/v1` | Parte da URL real da API; não aparece nas rotas públicas do site. |

## Termos proibidos ou ambíguos

| Evitar | Usar | Motivo |
| --- | --- | --- |
| `Article` como model/entidade | `Post` | A interface usa “artigo”, mas o código adotou Post. |
| `User` sem contexto | `Profile`, `AuthenticatedUser`, `Reader`, `Admin` ou `auth.users` | Evita confundir identidade, perfil e persona. |
| `Draft` como tabela | `PostStatus.DRAFT` | Rascunho é estado de Post. |
| comentário `PUBLISHED` | comentário `VISIBLE` | `PUBLISHED` pertence ao ciclo de Post. |
| “aprovar comentário novo” | “publicar imediatamente” ou “restaurar comentário” | Comentários novos não aguardam aprovação. |
| `Reply` como entidade | `Comment` com `parentId` | Resposta é o segundo nível de Comment. |
| `Favorite` | `Bookmark` | Evita dois nomes para artigo salvo. |
| `Like` como entidade | `Reaction` com `type = LIKE` | Reaction também suporta DISLIKE. |
| `NewsletterUser` | `Subscriber` / `NewsletterSubscriber` | Assinante pode não possuir conta. |
| “deletar post publicado” | `archive()` | Post publicado não é apagado pela operação comum. |
| “deletar comentário” como remoção física | `softDelete()` | A thread precisa permanecer consistente. |
| “URL da mídia” como fonte persistida | `storagePath` | URL pode mudar; path identifica o objeto. |
| “email enviado” sem contexto | campanha aceita (`SENT`) ou entrega individual (`DELIVERED`) | Aceite do provedor não garante entrega. |
| “falha de email” genérica | `FAILED`, `DELIVERY_DELAYED`, `BOUNCED`, `COMPLAINED` ou `SUPPRESSED` | Cada evento possui efeito diferente. |
| “notificação” genérica | email transacional ou notificação em tempo real | A V1 possui o primeiro e não possui o segundo. |
| `updateStatus()` | verbo de transição específico | Preserva intenção e invariantes do domínio. |
| `delete()` genérico | `archive()`, `softDelete()`, `removeBookmark()` ou `purge()` | Exclusões têm semânticas diferentes. |
| versão sem qualificador | `contentSchemaVersion` ou `PostRevision.version` | Estrutura do editor e revisão editorial são conceitos diferentes. |

## Exemplos de linguagem correta

### Requisito

Correto: “Quando um Reader autenticado cria um Comment válido, ele nasce `VISIBLE` e o CommentsService solicita um email transacional ao Admin depois da persistência.”

Ambíguo: “Quando o usuário postar, publique e notifique.”

### Caso de uso

Correto: “`PostsService.publish(postId, adminId)` carrega o Post, executa `post.publish(now)` e persiste a transição.”

Ambíguo: “O controller atualiza o status do artigo.”

### Persistência

Correto: “`Reaction(profileId, postId)` é unique; `setReaction()` troca o tipo sem criar segundo vínculo.”

Ambíguo: “Salva outro like para o usuário.”

### Email

Correto: “`EmailCampaign.SENT` indica aceite pelo Resend; `EmailDelivery.DELIVERED` indica entrega ao servidor destinatário.”

Ambíguo: “A newsletter foi entregue.”

## Checklist obrigatório de code review

- [ ] Novos nomes seguem os termos canônicos deste glossário.
- [ ] Entidades, models Prisma, DTOs, services, endpoints e testes usam o mesmo conceito sem sinônimos acidentais.
- [ ] Persona, identidade do Supabase, `AuthenticatedUser` e `Profile` não foram confundidos.
- [ ] Estados usam o enum correto e não foram substituídos por strings livres.
- [ ] Transições usam verbos de negócio, não `updateStatus()` ou `delete()` genérico.
- [ ] “Artigo” na UI corresponde a `Post` no código.
- [ ] Comentário novo nasce `VISIBLE`; `approve()` significa restauração administrativa.
- [ ] `Reaction` e `Bookmark` mantêm suas semânticas de toggle/idempotência.
- [ ] Campanha aceita e entrega individual não foram tratadas como o mesmo evento.
- [ ] Email transacional e notificação em tempo real não foram confundidos.
- [ ] Mudança necessária no vocabulário atualizou este arquivo e os contratos relacionados.

## Critérios de aprovação

- Cada conceito principal possui termo em português, nome em inglês e definição única.
- Estados e ações das entidades aprovadas estão registrados.
- Termos proibidos ou ambíguos possuem substituto explícito.
- O glossário cobre produto, domínio, API, persistência, frontend e testes.
- A checklist de code review impede divergência futura do vocabulário.

## Referências

- `docs/product/v1-scope.md`
- `docs/product/domain-rules-and-states.md`
- `docs/product/api-contract-v1.md`
- `docs/product/data-model-v1.md`
- `docs_personal/plano_execucao_vavito_archives.html`
- Notion: `Task 0.6 — Criar glossário da Linguagem Ubíqua`
