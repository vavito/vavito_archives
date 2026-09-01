export interface paths {
  '/api/v1': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Identifica a API e seu estado básico */
    get: operations['app_getRoot'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/posts/{slug}/comments': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Lista comentários visíveis e respostas diretas */
    get: operations['comments_list'];
    put?: never;
    /** Publica um comentário ou resposta */
    post: operations['comments_create'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/comments/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    /** Aplica soft delete a um comentário */
    delete: operations['comments_delete'];
    options?: never;
    head?: never;
    /** Edita um comentário próprio */
    patch: operations['comments_update'];
    trace?: never;
  };
  '/api/v1/admin/comments': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Lista comentários para moderação */
    get: operations['adminComments_list'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/admin/comments/{id}/status': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /** Modera um comentário */
    patch: operations['adminComments_moderate'];
    trace?: never;
  };
  '/api/v1/posts': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Lista posts publicados */
    get: operations['posts_list'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/posts/search': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Busca posts publicados por título, resumo ou tag */
    get: operations['posts_search'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/posts/{slug}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Consulta um post publicado pelo slug */
    get: operations['posts_getBySlug'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/posts/{slug}/views': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Registra uma visualização do post publicado */
    post: operations['posts_registerView'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/tags': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Lista tags e a quantidade de posts publicados */
    get: operations['tags_list'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/admin/posts': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Lista posts para administração */
    get: operations['adminPosts_list'];
    put?: never;
    /** Cria um rascunho */
    post: operations['adminPosts_create'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/admin/posts/{id}/revisions': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Lista o histórico de edições de um post publicado */
    get: operations['adminPosts_listRevisions'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/admin/posts/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Consulta um post para administração e preview */
    get: operations['adminPosts_getById'];
    put?: never;
    post?: never;
    /** Exclui permanentemente um post elegível */
    delete: operations['adminPosts_delete'];
    options?: never;
    head?: never;
    /** Edita um post e registra revisão quando já publicado */
    patch: operations['adminPosts_update'];
    trace?: never;
  };
  '/api/v1/admin/posts/{id}/publish': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Publica um rascunho */
    post: operations['adminPosts_publish'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/admin/posts/{id}/unpublish': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Retorna um post publicado para rascunho */
    post: operations['adminPosts_unpublish'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/admin/posts/{id}/archive': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Arquiva um post */
    post: operations['adminPosts_archive'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/admin/posts/{id}/restore': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Restaura um post arquivado como rascunho */
    post: operations['adminPosts_restore'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/contact': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Envia uma mensagem de contato ao autor */
    post: operations['contact_create'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/posts/{id}/reaction': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    /** Cria ou troca a reação do usuário no post */
    put: operations['engagement_setReaction'];
    post?: never;
    /** Remove a reação atual do usuário no post */
    delete: operations['engagement_removeReaction'];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/bookmarks': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Lista a biblioteca privada de posts salvos */
    get: operations['engagement_listBookmarks'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/posts/{id}/bookmark': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    /** Salva um post na biblioteca do usuário */
    put: operations['engagement_saveBookmark'];
    post?: never;
    /** Remove um post da biblioteca do usuário */
    delete: operations['engagement_removeBookmark'];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/health': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Verifica se o processo da API está ativo */
    get: operations['health_check'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/health/ready': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Verifica se a API consegue acessar o banco de dados */
    get: operations['health_checkReadiness'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/admin/media': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Envia uma mídia para uso editorial */
    post: operations['adminMedia_upload'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/newsletter/subscriptions': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Solicita inscrição com double opt-in */
    post: operations['newsletter_subscribe'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/newsletter/subscriptions/confirm': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Confirma uma inscrição pendente */
    post: operations['newsletter_confirm'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/newsletter/subscriptions/unsubscribe': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Cancela uma inscrição de forma idempotente */
    post: operations['newsletter_unsubscribe'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/admin/newsletter/campaigns': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Lista campanhas da newsletter */
    get: operations['adminCampaigns_list'];
    put?: never;
    /** Cria rascunho de campanha para um artigo publicado */
    post: operations['adminCampaigns_create'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/admin/newsletter/campaigns/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Consulta campanha e seu preview congelado */
    get: operations['adminCampaigns_get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /** Edita uma campanha ainda em rascunho */
    patch: operations['adminCampaigns_update'];
    trace?: never;
  };
  '/api/v1/admin/newsletter/campaigns/{id}/send': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Envia uma campanha uma única vez */
    post: operations['adminCampaigns_send'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/webhooks/resend': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Processa eventos assinados do Resend */
    post: operations['resendWebhooks_process'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/profiles/me': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Consulta o perfil do usuário autenticado */
    get: operations['profiles_getMe'];
    put?: never;
    post?: never;
    /** Exclui e anonimiza a conta do usuário autenticado */
    delete: operations['profiles_deleteAccount'];
    options?: never;
    head?: never;
    /** Atualiza o perfil do usuário autenticado */
    patch: operations['profiles_updateMe'];
    trace?: never;
  };
  '/api/v1/profiles/me/avatar': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    /** Envia ou substitui o avatar do usuário autenticado */
    put: operations['profiles_uploadAvatar'];
    post?: never;
    /** Remove o avatar do usuário autenticado */
    delete: operations['profiles_removeAvatar'];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
}
export type webhooks = Record<string, never>;
export interface components {
  schemas: {
    ErrorDetailDto: {
      /** @example email */
      field: string;
      /** @example INVALID_EMAIL */
      reason: string;
    };
    ErrorResponseDto: {
      /** @example 400 */
      statusCode: number;
      /** @example VALIDATION_ERROR */
      code: string;
      /** @example Dados inválidos. */
      message: string;
      details: components['schemas']['ErrorDetailDto'][] | null;
      /**
       * Format: date-time
       * @example 2026-08-12T20:15:00.000Z
       */
      timestamp: string;
      /** @example /api/v1/newsletter/subscriptions */
      path: string;
      /** @example 019c2d62-6e90-7000-8000-000000000000 */
      requestId: string;
    };
    Object: Record<string, never>;
    CommentAuthorDto: {
      /**
       * Format: uuid
       * @example 019c2d62-6e90-7000-8000-000000000003
       */
      id: string;
      /** @example Leitor do Vavito */
      displayName: string;
      /** @example https://cdn.example.com/avatars/leitor.webp */
      avatarUrl: Record<string, never> | null;
    };
    CommentResponseDto: {
      /**
       * Format: uuid
       * @example 019c2d62-6e90-7000-8000-000000000040
       */
      id: string;
      /**
       * Format: uuid
       * @example 019c2d62-6e90-7000-8000-000000000010
       */
      postId: string;
      /**
       * Format: uuid
       * @example null
       */
      parentId: Record<string, never> | null;
      /** @example Excelente explicação sobre o tema. */
      content: Record<string, never> | null;
      /**
       * @example VISIBLE
       * @enum {string}
       */
      status: 'VISIBLE' | 'DELETED';
      author: components['schemas']['CommentAuthorDto'] | null;
      /** @example false */
      edited: boolean;
      /**
       * Format: date-time
       * @example 2026-08-24T14:30:00.000Z
       */
      createdAt: string;
      /**
       * Format: date-time
       * @example null
       */
      editedAt: Record<string, never> | null;
      replies: components['schemas']['CommentResponseDto'][];
    };
    PaginationMetaDto: {
      /** @example 1 */
      page: number;
      /** @example 12 */
      limit: number;
      /** @example 42 */
      total: number;
      /** @example 4 */
      totalPages: number;
    };
    PaginatedCommentsResponseDto: {
      items: components['schemas']['CommentResponseDto'][];
      meta: components['schemas']['PaginationMetaDto'];
    };
    CreateCommentDto: {
      /** @example Excelente explicação sobre a arquitetura do projeto. */
      content: string;
      /**
       * Format: uuid
       * @example 019c2d62-6e90-7000-8000-000000000040
       */
      parentId?: string;
    };
    UpdateCommentDto: {
      /** @example Comentário atualizado com uma informação complementar. */
      content: string;
    };
    /** @enum {string} */
    CommentStatus: 'VISIBLE' | 'HIDDEN' | 'SPAM' | 'DELETED';
    CommentAdminResponseDto: {
      /**
       * Format: uuid
       * @example 019c2d62-6e90-7000-8000-000000000040
       */
      id: string;
      /**
       * Format: uuid
       * @example 019c2d62-6e90-7000-8000-000000000010
       */
      postId: string;
      /**
       * Format: uuid
       * @example null
       */
      parentId: Record<string, never> | null;
      /** @example Conteúdo em análise pela moderação. */
      content: Record<string, never> | null;
      /** @example HIDDEN */
      status: components['schemas']['CommentStatus'];
      author: components['schemas']['CommentAuthorDto'] | null;
      /** @example Conteúdo fora das regras da comunidade. */
      moderationReason: Record<string, never> | null;
      /**
       * Format: date-time
       * @example 2026-08-24T14:30:00.000Z
       */
      createdAt: string;
      /**
       * Format: date-time
       * @example null
       */
      editedAt: Record<string, never> | null;
      /**
       * Format: date-time
       * @example null
       */
      deletedAt: Record<string, never> | null;
    };
    PaginatedAdminCommentsResponseDto: {
      items: components['schemas']['CommentAdminResponseDto'][];
      meta: components['schemas']['PaginationMetaDto'];
    };
    /** @enum {string} */
    CommentModerationStatus: 'VISIBLE' | 'HIDDEN' | 'SPAM';
    ModerateCommentDto: {
      /** @example HIDDEN */
      status: components['schemas']['CommentModerationStatus'];
      /** @example Conteúdo fora das regras da comunidade. */
      reason?: string;
    };
    /** @enum {string} */
    PublicPostsSort: 'popular' | 'recent';
    TagResponseDto: {
      /**
       * Format: uuid
       * @example 019c2d62-6e90-7000-8000-000000000011
       */
      id: string;
      /** @example TypeScript */
      name: string;
      /** @example typescript */
      slug: string;
      /** @example 12 */
      publishedPostCount?: number;
    };
    PostSummaryDto: {
      /**
       * Format: uuid
       * @example 019c2d62-6e90-7000-8000-000000000010
       */
      id: string;
      /** @example arquitetura-aplicacoes-nestjs */
      slug: string;
      /** @example Arquitetura de aplicações NestJS */
      title: string;
      /** @example Uma introdução prática à arquitetura do projeto. */
      excerpt: string;
      /** @example https://cdn.example.com/posts/capa.webp */
      coverUrl: string | null;
      /** @example Diagrama de arquitetura */
      coverAlt: string | null;
      tags: components['schemas']['TagResponseDto'][];
      /**
       * Format: date-time
       * @example 2026-08-20T12:00:00.000Z
       */
      publishedAt: string;
      /** @example 6 */
      readingTimeMinutes: number;
      /** @example 128 */
      viewCount: number;
    };
    PaginatedPostSummaryDto: {
      items: components['schemas']['PostSummaryDto'][];
      meta: components['schemas']['PaginationMetaDto'];
    };
    PostReactionCountsDto: {
      /** @example 12 */
      like: number;
      /** @example 1 */
      dislike: number;
    };
    /** @enum {string} */
    ReactionType: 'LIKE' | 'DISLIKE';
    PostViewerStateDto: {
      /** @example LIKE */
      reaction: components['schemas']['ReactionType'] | null;
      /** @example true */
      bookmarked: boolean;
    };
    PostDetailResponseDto: {
      /**
       * Format: uuid
       * @example 019c2d62-6e90-7000-8000-000000000010
       */
      id: string;
      /** @example arquitetura-aplicacoes-nestjs */
      slug: string;
      /** @example Arquitetura de aplicações NestJS */
      title: string;
      /** @example Uma introdução prática à arquitetura do projeto. */
      excerpt: string;
      /** @example https://cdn.example.com/posts/capa.webp */
      coverUrl: string | null;
      /** @example Diagrama de arquitetura */
      coverAlt: string | null;
      tags: components['schemas']['TagResponseDto'][];
      /**
       * Format: date-time
       * @example 2026-08-20T12:00:00.000Z
       */
      publishedAt: string;
      /** @example 6 */
      readingTimeMinutes: number;
      /** @example 128 */
      viewCount: number;
      /**
       * @example {
       *       "content": [
       *         {
       *           "type": "paragraph"
       *         }
       *       ],
       *       "type": "doc"
       *     }
       */
      content: {
        [key: string]: unknown;
      };
      /** @example 1 */
      contentSchemaVersion: number;
      /** @example Arquitetura NestJS */
      seoTitle: string | null;
      /** @example Aprenda a organizar uma aplicação NestJS. */
      seoDescription: string | null;
      reactionCounts: components['schemas']['PostReactionCountsDto'];
      viewer: components['schemas']['PostViewerStateDto'] | null;
    };
    /** @enum {string} */
    PostStatus: 'ARCHIVED' | 'DRAFT' | 'PUBLISHED';
    PostAuthorDto: {
      /**
       * Format: uuid
       * @example 019c2d62-6e90-7000-8000-000000000002
       */
      id: string;
      /** @example João Victor */
      displayName: string;
    };
    PostAdminSummaryDto: {
      /**
       * Format: uuid
       * @example 019c2d62-6e90-7000-8000-000000000010
       */
      id: string;
      /** @example arquitetura-aplicacoes-nestjs */
      slug: Record<string, never> | null;
      /** @example Arquitetura de aplicações NestJS */
      title: string;
      /** @example PUBLISHED */
      status: components['schemas']['PostStatus'];
      author: components['schemas']['PostAuthorDto'];
      /**
       * Format: date-time
       * @example 2026-08-20T12:00:00.000Z
       */
      publishedAt: Record<string, never> | null;
      /**
       * Format: date-time
       * @example 2026-08-25T18:30:00.000Z
       */
      editedAt: Record<string, never> | null;
      /**
       * Format: date-time
       * @example 2026-08-27T20:15:00.000Z
       */
      updatedAt: string;
    };
    PaginatedPostAdminSummaryDto: {
      items: components['schemas']['PostAdminSummaryDto'][];
      meta: components['schemas']['PaginationMetaDto'];
    };
    PostRevisionAdminDto: {
      /**
       * Format: uuid
       * @example 019c2d62-6e90-7000-8000-000000000030
       */
      id: string;
      /** @example 2 */
      version: number;
      editor: components['schemas']['PostAuthorDto'];
      /**
       * @description Snapshot integral do post antes da edição publicada.
       * @example {
       *       "excerpt": "Resumo anterior.",
       *       "slug": "arquitetura-aplicacoes-nestjs",
       *       "title": "Arquitetura de aplicações NestJS"
       *     }
       */
      snapshot: {
        [key: string]: unknown;
      };
      /**
       * Format: date-time
       * @example 2026-08-25T18:30:00.000Z
       */
      createdAt: string;
    };
    PaginatedPostRevisionAdminDto: {
      items: components['schemas']['PostRevisionAdminDto'][];
      meta: components['schemas']['PaginationMetaDto'];
    };
    PostAdminDetailDto: {
      /**
       * Format: uuid
       * @example 019c2d62-6e90-7000-8000-000000000010
       */
      id: string;
      /** @example arquitetura-aplicacoes-nestjs */
      slug: Record<string, never> | null;
      /** @example Arquitetura de aplicações NestJS */
      title: string;
      /** @example PUBLISHED */
      status: components['schemas']['PostStatus'];
      author: components['schemas']['PostAuthorDto'];
      /**
       * Format: date-time
       * @example 2026-08-20T12:00:00.000Z
       */
      publishedAt: Record<string, never> | null;
      /**
       * Format: date-time
       * @example 2026-08-25T18:30:00.000Z
       */
      editedAt: Record<string, never> | null;
      /**
       * Format: date-time
       * @example 2026-08-27T20:15:00.000Z
       */
      updatedAt: string;
      /** @example Uma introdução prática à arquitetura. */
      excerpt: Record<string, never> | null;
      /**
       * @example {
       *       "content": [
       *         {
       *           "type": "paragraph"
       *         }
       *       ],
       *       "type": "doc"
       *     }
       */
      content: {
        [key: string]: unknown;
      };
      /** @example 1 */
      contentSchemaVersion: number;
      tags: components['schemas']['TagResponseDto'][];
      /**
       * Format: uuid
       * @example 019c2d62-6e90-7000-8000-000000000020
       */
      coverMediaId: Record<string, never> | null;
      /** @example https://cdn.example.com/posts/capa.webp */
      coverUrl: Record<string, never> | null;
      /** @example Diagrama de arquitetura */
      coverAlt: Record<string, never> | null;
      /** @example Arquitetura NestJS */
      seoTitle: Record<string, never> | null;
      /** @example Aprenda a organizar uma aplicação NestJS. */
      seoDescription: Record<string, never> | null;
      /** @example 6 */
      readingTimeMinutes: number;
      /** @example 128 */
      viewCount: number;
      /**
       * Format: date-time
       * @example null
       */
      archivedAt: Record<string, never> | null;
      /**
       * Format: date-time
       * @example 2026-08-18T10:00:00.000Z
       */
      createdAt: string;
    };
    CreatePostDto: {
      /** @example Arquitetura de aplicações NestJS */
      title?: string;
      /** @example arquitetura-aplicacoes-nestjs */
      slug?: string;
    };
    UpdatePostDto: {
      /** @example Arquitetura de aplicações NestJS */
      title?: string;
      /** @example arquitetura-aplicacoes-nestjs */
      slug?: string;
      /** @example Uma introdução prática à arquitetura do projeto. */
      excerpt?: string;
      /**
       * @example {
       *       "content": [
       *         {
       *           "type": "paragraph"
       *         }
       *       ],
       *       "type": "doc"
       *     }
       */
      content?: {
        [key: string]: unknown;
      };
      /** @example 1 */
      contentSchemaVersion?: number;
      /**
       * @example [
       *       "NestJS",
       *       "TypeScript"
       *     ]
       */
      tagNames?: string[];
      /**
       * Format: uuid
       * @example 019c2d62-6e90-7000-8000-000000000020
       */
      coverMediaId?: Record<string, never> | null;
      /** @example Arquitetura NestJS */
      seoTitle?: Record<string, never> | null;
      /** @example Aprenda a organizar uma aplicação NestJS. */
      seoDescription?: Record<string, never> | null;
    };
    DeletePostDto: {
      /**
       * @description Confirma explicitamente a exclusão permanente do post.
       * @example true
       */
      confirm: boolean;
    };
    CreateContactMessageDto: {
      /** @example João Victor */
      name: string;
      /** @example leitor@example.com */
      email: string;
      /** @example Sugestão de pauta */
      subject?: string;
      /** @example Gostaria de sugerir uma pauta para o próximo artigo. */
      message: string;
    };
    ContactAcceptedResponseDto: {
      /** @example Mensagem recebida. Retornaremos assim que possível. */
      message: string;
    };
    SetReactionDto: {
      /** @example LIKE */
      type: components['schemas']['ReactionType'];
    };
    ReactionCountsDto: {
      /** @example 12 */
      like: number;
      /** @example 1 */
      dislike: number;
    };
    ReactionResponseDto: {
      /** @example LIKE */
      reaction: components['schemas']['ReactionType'] | null;
      counts: components['schemas']['ReactionCountsDto'];
    };
    BookmarkResponseDto: {
      /** @example true */
      bookmarked: boolean;
    };
    ApiHealthCheckDto: {
      /**
       * @example up
       * @enum {string}
       */
      status: 'up';
    };
    HealthChecksDto: {
      api: components['schemas']['ApiHealthCheckDto'];
    };
    HealthResponseDto: {
      /**
       * @example ok
       * @enum {string}
       */
      status: 'ok';
      /** @example 1.0.0 */
      version: string;
      /**
       * Format: date-time
       * @example 2026-08-04T20:15:00.000Z
       */
      timestamp: string;
      checks: components['schemas']['HealthChecksDto'];
    };
    DatabaseReadinessCheckDto: {
      /**
       * @example up
       * @enum {string}
       */
      status: 'up' | 'down';
    };
    ReadinessChecksDto: {
      database: components['schemas']['DatabaseReadinessCheckDto'];
    };
    ReadinessResponseDto: {
      /**
       * @example ok
       * @enum {string}
       */
      status: 'ok' | 'error';
      /**
       * Format: date-time
       * @example 2026-08-05T20:15:00.000Z
       */
      timestamp: string;
      checks: components['schemas']['ReadinessChecksDto'];
    };
    /** @enum {string} */
    MediaAssetStatus: 'FAILED' | 'ORPHANED' | 'READY' | 'UPLOADING';
    MediaResponseDto: {
      /**
       * Format: uuid
       * @example 019c2d62-6e90-7000-8000-000000000020
       */
      id: string;
      /** @example https://project.supabase.co/storage/v1/object/public/media/2026/08/id.webp */
      url: string;
      /** @example 2026/08/0198f75f-89df-4ae7-a1ec-2e7834b3021a.webp */
      path: string;
      /**
       * @example image/webp
       * @enum {string}
       */
      mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
      /** @example 153642 */
      sizeBytes: number;
      /** @example 1200 */
      width?: Record<string, never> | null;
      /** @example 630 */
      height?: Record<string, never> | null;
      /** @example Diagrama da arquitetura da aplicação */
      altText: string;
      /** @example READY */
      status: components['schemas']['MediaAssetStatus'];
      /**
       * Format: date-time
       * @example 2026-08-22T15:00:00.000Z
       */
      createdAt: string;
    };
    /** @enum {string} */
    SubscriberConsentSource: 'ARTICLE' | 'FOOTER' | 'HOME';
    SubscribeNewsletterDto: {
      /** @example leitor@example.com */
      email: string;
      /**
       * @example true
       * @enum {boolean}
       */
      consent: true;
      /** @example ARTICLE */
      source: components['schemas']['SubscriberConsentSource'];
    };
    SubscriptionAcceptedResponseDto: {
      /** @example Se o endereço puder receber a newsletter, enviaremos as próximas instruções. */
      message: string;
    };
    ConfirmSubscriptionDto: {
      /**
       * @description Token opaco recebido no email de confirmação.
       * @example HfByP6b1hQ9lBf8Nw5vVJdWxe_vf1EpfkNGYw1iHt7Q
       */
      token: string;
    };
    SubscriptionConfirmedResponseDto: {
      /** @example Inscrição confirmada com sucesso. */
      message: string;
    };
    UnsubscribeDto: {
      /**
       * @description Token opaco recebido nos emails da newsletter.
       * @example HfByP6b1hQ9lBf8Nw5vVJdWxe_vf1EpfkNGYw1iHt7Q
       */
      token: string;
    };
    /** @enum {string} */
    CampaignStatus: 'DRAFT' | 'FAILED' | 'SENDING' | 'SENT';
    CampaignPostSnapshotDto: {
      /** @example Resumo congelado do artigo. */
      excerpt: string;
      /**
       * Format: uuid
       * @example 019c2d62-6e90-7000-8000-000000000010
       */
      id: string;
      /**
       * Format: date-time
       * @example 2026-08-24T12:00:00.000Z
       */
      publishedAt: string;
      /** @example 7 */
      readingTimeMinutes: number;
      /** @example arquivos-e-memoria-digital */
      slug: string;
      /** @example Arquivos e memória digital */
      title: string;
    };
    EmailCampaignAdminDto: {
      /** @example 42 */
      audienceCount: number;
      /**
       * Format: date-time
       * @example 2026-08-25T10:00:00.000Z
       */
      createdAt: string;
      /**
       * Format: uuid
       * @example 019c2d62-6e90-7000-8000-000000000004
       */
      createdById: string;
      /** @example null */
      failureReason: Record<string, never> | null;
      /**
       * @description HTML congelado usado como preview e base para o envio.
       * @example <article><h1>Arquivos e memória digital</h1></article>
       */
      htmlSnapshot: string;
      /**
       * Format: uuid
       * @example 019c2d62-6e90-7000-8000-000000000050
       */
      id: string;
      /**
       * Format: uuid
       * @example 019c2d62-6e90-7000-8000-000000000051
       */
      idempotencyKey: Record<string, never> | null;
      postSnapshot: components['schemas']['CampaignPostSnapshotDto'];
      /** @example Uma nova leitura já está disponível. */
      previewText: string;
      /** @example re_123456789 */
      resendId: Record<string, never> | null;
      /**
       * Format: date-time
       * @example 2026-08-25T13:00:00.000Z
       */
      sendStartedAt: Record<string, never> | null;
      /**
       * Format: date-time
       * @example 2026-08-25T13:01:00.000Z
       */
      sentAt: Record<string, never> | null;
      /** @example SENT */
      status: components['schemas']['CampaignStatus'];
      /** @example Novo artigo: Arquivos e memória digital */
      subject: string;
      /**
       * Format: date-time
       * @example 2026-08-25T13:01:00.000Z
       */
      updatedAt: string;
    };
    CampaignPaginationMetaDto: {
      /** @example 20 */
      limit: number;
      /** @example 1 */
      page: number;
      /** @example 42 */
      total: number;
      /** @example 3 */
      totalPages: number;
    };
    PaginatedEmailCampaignsDto: {
      items: components['schemas']['EmailCampaignAdminDto'][];
      meta: components['schemas']['CampaignPaginationMetaDto'];
    };
    CreateCampaignDto: {
      /**
       * Format: uuid
       * @example 019c2d62-6e90-7000-8000-000000000010
       */
      postId: string;
      /** @example Novo artigo: Arquivos e memória digital */
      subject: string;
      /** @example Uma nova leitura já está disponível. */
      previewText?: string;
    };
    UpdateCampaignDto: {
      /**
       * @description HTML completo usado no preview e congelado no envio.
       * @example <article><h1>Novo artigo</h1><a href="{{unsubscribeUrl}}">Cancelar</a></article>
       */
      html?: string;
      /** @example Uma nova leitura já está disponível. */
      previewText?: string;
      /** @example Novo artigo: Arquivos e memória digital */
      subject?: string;
    };
    WebhookReceivedResponseDto: {
      /** @example true */
      received: boolean;
    };
    /** @enum {string} */
    UserRole: 'USER' | 'ADMIN';
    ProfileResponseDto: {
      /**
       * Format: uuid
       * @example 019c2d62-6e90-7000-8000-000000000001
       */
      id: string;
      /** @example João Victor */
      displayName: string;
      /** @example https://project.supabase.co/storage/v1/object/public/avatars/id/avatar.webp */
      avatarUrl?: Record<string, never> | null;
      /** @example USER */
      role: components['schemas']['UserRole'];
      /**
       * Format: date-time
       * @example 2026-08-12T20:15:00.000Z
       */
      createdAt: string;
      /**
       * Format: date-time
       * @example 2026-08-27T20:15:00.000Z
       */
      updatedAt: string;
    };
    UpdateProfileDto: {
      /** @example João Victor */
      displayName?: string;
    };
    DeleteAccountDto: {
      /**
       * @example EXCLUIR MINHA CONTA
       * @enum {string}
       */
      confirmation: 'EXCLUIR MINHA CONTA';
    };
  };
  responses: never;
  parameters: never;
  requestBodies: never;
  headers: never;
  pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
  app_getRoot: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            /** @example Vavito Archives API */
            name: string;
            /** @example running */
            status: string;
          };
        };
      };
      /** @description Falha interna inesperada. */
      500: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "code": "INTERNAL_ERROR",
           *       "details": null,
           *       "message": "Erro interno do servidor.",
           *       "path": "/api/v1",
           *       "requestId": "019c2d62-6e90-7000-8000-000000000000",
           *       "statusCode": 500,
           *       "timestamp": "2026-08-27T20:15:00.000Z"
           *     }
           */
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
    };
  };
  comments_list: {
    parameters: {
      query?: {
        /** @example 1 */
        page?: components['schemas']['Object'];
        /** @example 20 */
        limit?: components['schemas']['Object'];
      };
      header?: never;
      path: {
        /** @example arquitetura-aplicacoes-nestjs */
        slug: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['PaginatedCommentsResponseDto'];
        };
      };
      /** @description Dados ou parâmetros inválidos. */
      400: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Post não encontrado ou não publicado. */
      404: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Falha interna inesperada. */
      500: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "code": "INTERNAL_ERROR",
           *       "details": null,
           *       "message": "Erro interno do servidor.",
           *       "path": "/api/v1/posts/{slug}/comments",
           *       "requestId": "019c2d62-6e90-7000-8000-000000000000",
           *       "statusCode": 500,
           *       "timestamp": "2026-08-27T20:15:00.000Z"
           *     }
           */
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
    };
  };
  comments_create: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @example arquitetura-aplicacoes-nestjs */
        slug: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['CreateCommentDto'];
      };
    };
    responses: {
      201: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['CommentResponseDto'];
        };
      };
      /** @description Dados ou parâmetros inválidos. */
      400: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Autenticação necessária. */
      401: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Acesso não autorizado. */
      403: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "code": "FORBIDDEN",
           *       "details": null,
           *       "message": "Acesso não autorizado.",
           *       "path": "/api/v1/posts/{slug}/comments",
           *       "requestId": "019c2d62-6e90-7000-8000-000000000000",
           *       "statusCode": 403,
           *       "timestamp": "2026-08-27T20:15:00.000Z"
           *     }
           */
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Comentário pai ou profundidade inválida. */
      409: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Conteúdo inválido. */
      422: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Limite de comentários excedido. */
      429: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Falha interna inesperada. */
      500: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "code": "INTERNAL_ERROR",
           *       "details": null,
           *       "message": "Erro interno do servidor.",
           *       "path": "/api/v1/posts/{slug}/comments",
           *       "requestId": "019c2d62-6e90-7000-8000-000000000000",
           *       "statusCode": 500,
           *       "timestamp": "2026-08-27T20:15:00.000Z"
           *     }
           */
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
    };
  };
  comments_delete: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @example 019c2d62-6e90-7000-8000-000000000010 */
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      204: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Dados ou parâmetros inválidos. */
      400: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Autenticação necessária. */
      401: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Acesso restrito ao autor ou administrador. */
      403: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Comentário não encontrado. */
      404: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Falha interna inesperada. */
      500: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "code": "INTERNAL_ERROR",
           *       "details": null,
           *       "message": "Erro interno do servidor.",
           *       "path": "/api/v1/comments/{id}",
           *       "requestId": "019c2d62-6e90-7000-8000-000000000000",
           *       "statusCode": 500,
           *       "timestamp": "2026-08-27T20:15:00.000Z"
           *     }
           */
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
    };
  };
  comments_update: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @example 019c2d62-6e90-7000-8000-000000000010 */
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['UpdateCommentDto'];
      };
    };
    responses: {
      200: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['CommentResponseDto'];
        };
      };
      /** @description Dados ou parâmetros inválidos. */
      400: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Autenticação necessária. */
      401: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Somente o autor pode editar. */
      403: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Comentário não encontrado. */
      404: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Estado não editável. */
      409: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Falha interna inesperada. */
      500: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "code": "INTERNAL_ERROR",
           *       "details": null,
           *       "message": "Erro interno do servidor.",
           *       "path": "/api/v1/comments/{id}",
           *       "requestId": "019c2d62-6e90-7000-8000-000000000000",
           *       "statusCode": 500,
           *       "timestamp": "2026-08-27T20:15:00.000Z"
           *     }
           */
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
    };
  };
  adminComments_list: {
    parameters: {
      query?: {
        /** @example 1 */
        page?: number;
        /** @example 20 */
        limit?: number;
        /** @example 019c2d62-6e90-7000-8000-000000000010 */
        postId?: string;
        /** @example VISIBLE */
        status?: components['schemas']['CommentStatus'];
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['PaginatedAdminCommentsResponseDto'];
        };
      };
      /** @description Dados ou parâmetros inválidos. */
      400: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Autenticação necessária. */
      401: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Acesso exclusivo de administrador. */
      403: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Falha interna inesperada. */
      500: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "code": "INTERNAL_ERROR",
           *       "details": null,
           *       "message": "Erro interno do servidor.",
           *       "path": "/api/v1/admin/comments",
           *       "requestId": "019c2d62-6e90-7000-8000-000000000000",
           *       "statusCode": 500,
           *       "timestamp": "2026-08-27T20:15:00.000Z"
           *     }
           */
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
    };
  };
  adminComments_moderate: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @example 019c2d62-6e90-7000-8000-000000000010 */
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ModerateCommentDto'];
      };
    };
    responses: {
      200: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['CommentAdminResponseDto'];
        };
      };
      /** @description Dados ou parâmetros inválidos. */
      400: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Autenticação necessária. */
      401: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Acesso exclusivo de administrador. */
      403: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Comentário não encontrado. */
      404: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Transição de estado inválida. */
      409: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Falha interna inesperada. */
      500: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "code": "INTERNAL_ERROR",
           *       "details": null,
           *       "message": "Erro interno do servidor.",
           *       "path": "/api/v1/admin/comments/{id}/status",
           *       "requestId": "019c2d62-6e90-7000-8000-000000000000",
           *       "statusCode": 500,
           *       "timestamp": "2026-08-27T20:15:00.000Z"
           *     }
           */
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
    };
  };
  posts_list: {
    parameters: {
      query?: {
        /** @example 1 */
        page?: number;
        /** @example 12 */
        limit?: number;
        /** @example typescript */
        tag?: string;
        /** @example popular */
        sort?: components['schemas']['PublicPostsSort'];
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['PaginatedPostSummaryDto'];
        };
      };
      /** @description Parâmetros inválidos. */
      400: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Falha interna inesperada. */
      500: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "code": "INTERNAL_ERROR",
           *       "details": null,
           *       "message": "Erro interno do servidor.",
           *       "path": "/api/v1/posts",
           *       "requestId": "019c2d62-6e90-7000-8000-000000000000",
           *       "statusCode": 500,
           *       "timestamp": "2026-08-27T20:15:00.000Z"
           *     }
           */
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
    };
  };
  posts_search: {
    parameters: {
      query: {
        /** @example nestjs */
        q: string;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['PostSummaryDto'][];
        };
      };
      /** @description Parâmetros inválidos. */
      400: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Limite de buscas excedido. */
      429: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Falha interna inesperada. */
      500: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "code": "INTERNAL_ERROR",
           *       "details": null,
           *       "message": "Erro interno do servidor.",
           *       "path": "/api/v1/posts/search",
           *       "requestId": "019c2d62-6e90-7000-8000-000000000000",
           *       "statusCode": 500,
           *       "timestamp": "2026-08-27T20:15:00.000Z"
           *     }
           */
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
    };
  };
  posts_getBySlug: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @example arquitetura-aplicacoes-nestjs */
        slug: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['PostDetailResponseDto'];
        };
      };
      /** @description O slug informado é histórico; redireciona para o slug atual. */
      308: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Parâmetros inválidos. */
      400: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Post inexistente ou não publicado. */
      404: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Falha interna inesperada. */
      500: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "code": "INTERNAL_ERROR",
           *       "details": null,
           *       "message": "Erro interno do servidor.",
           *       "path": "/api/v1/posts/{slug}",
           *       "requestId": "019c2d62-6e90-7000-8000-000000000000",
           *       "statusCode": 500,
           *       "timestamp": "2026-08-27T20:15:00.000Z"
           *     }
           */
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
    };
  };
  posts_registerView: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @example arquitetura-aplicacoes-nestjs */
        slug: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Visualização aceita para processamento. */
      202: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Parâmetros inválidos. */
      400: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Post inexistente ou não publicado. */
      404: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Limite de registros de visualização excedido. */
      429: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Falha interna inesperada. */
      500: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "code": "INTERNAL_ERROR",
           *       "details": null,
           *       "message": "Erro interno do servidor.",
           *       "path": "/api/v1/posts/{slug}/views",
           *       "requestId": "019c2d62-6e90-7000-8000-000000000000",
           *       "statusCode": 500,
           *       "timestamp": "2026-08-27T20:15:00.000Z"
           *     }
           */
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
    };
  };
  tags_list: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['TagResponseDto'][];
        };
      };
      /** @description Falha interna inesperada. */
      500: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "code": "INTERNAL_ERROR",
           *       "details": null,
           *       "message": "Erro interno do servidor.",
           *       "path": "/api/v1/tags",
           *       "requestId": "019c2d62-6e90-7000-8000-000000000000",
           *       "statusCode": 500,
           *       "timestamp": "2026-08-27T20:15:00.000Z"
           *     }
           */
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
    };
  };
  adminPosts_list: {
    parameters: {
      query?: {
        /** @example 1 */
        page?: number;
        /** @example 20 */
        limit?: number;
        /** @example ARCHIVED */
        status?: components['schemas']['PostStatus'];
        /** @example arquitetura */
        q?: string;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['PaginatedPostAdminSummaryDto'];
        };
      };
      /** @description Dados ou parâmetros inválidos. */
      400: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Autenticação necessária. */
      401: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Acesso exclusivo de administrador. */
      403: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Post não encontrado. */
      404: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Estado ou slug incompatível. */
      409: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Conteúdo ou slug semanticamente inválido. */
      422: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Falha interna inesperada. */
      500: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "code": "INTERNAL_ERROR",
           *       "details": null,
           *       "message": "Erro interno do servidor.",
           *       "path": "/api/v1/admin/posts",
           *       "requestId": "019c2d62-6e90-7000-8000-000000000000",
           *       "statusCode": 500,
           *       "timestamp": "2026-08-27T20:15:00.000Z"
           *     }
           */
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
    };
  };
  adminPosts_create: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['CreatePostDto'];
      };
    };
    responses: {
      201: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['PostAdminDetailDto'];
        };
      };
      /** @description Dados ou parâmetros inválidos. */
      400: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Autenticação necessária. */
      401: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Acesso exclusivo de administrador. */
      403: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Post não encontrado. */
      404: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Estado ou slug incompatível. */
      409: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Conteúdo ou slug semanticamente inválido. */
      422: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Falha interna inesperada. */
      500: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "code": "INTERNAL_ERROR",
           *       "details": null,
           *       "message": "Erro interno do servidor.",
           *       "path": "/api/v1/admin/posts",
           *       "requestId": "019c2d62-6e90-7000-8000-000000000000",
           *       "statusCode": 500,
           *       "timestamp": "2026-08-27T20:15:00.000Z"
           *     }
           */
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
    };
  };
  adminPosts_listRevisions: {
    parameters: {
      query?: {
        /** @example 1 */
        page?: number;
        /** @example 20 */
        limit?: number;
      };
      header?: never;
      path: {
        /** @example 019c2d62-6e90-7000-8000-000000000010 */
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['PaginatedPostRevisionAdminDto'];
        };
      };
      /** @description Dados ou parâmetros inválidos. */
      400: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Autenticação necessária. */
      401: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Acesso exclusivo de administrador. */
      403: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Post não encontrado. */
      404: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Estado ou slug incompatível. */
      409: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Conteúdo ou slug semanticamente inválido. */
      422: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Falha interna inesperada. */
      500: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "code": "INTERNAL_ERROR",
           *       "details": null,
           *       "message": "Erro interno do servidor.",
           *       "path": "/api/v1/admin/posts/{id}/revisions",
           *       "requestId": "019c2d62-6e90-7000-8000-000000000000",
           *       "statusCode": 500,
           *       "timestamp": "2026-08-27T20:15:00.000Z"
           *     }
           */
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
    };
  };
  adminPosts_getById: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @example 019c2d62-6e90-7000-8000-000000000010 */
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['PostAdminDetailDto'];
        };
      };
      /** @description Dados ou parâmetros inválidos. */
      400: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Autenticação necessária. */
      401: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Acesso exclusivo de administrador. */
      403: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Post não encontrado. */
      404: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Estado ou slug incompatível. */
      409: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Conteúdo ou slug semanticamente inválido. */
      422: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Falha interna inesperada. */
      500: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "code": "INTERNAL_ERROR",
           *       "details": null,
           *       "message": "Erro interno do servidor.",
           *       "path": "/api/v1/admin/posts/{id}",
           *       "requestId": "019c2d62-6e90-7000-8000-000000000000",
           *       "statusCode": 500,
           *       "timestamp": "2026-08-27T20:15:00.000Z"
           *     }
           */
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
    };
  };
  adminPosts_delete: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @example 019c2d62-6e90-7000-8000-000000000010 */
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['DeletePostDto'];
      };
    };
    responses: {
      204: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Dados ou parâmetros inválidos. */
      400: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Autenticação necessária. */
      401: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Acesso exclusivo de administrador. */
      403: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Post não encontrado. */
      404: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Estado ou slug incompatível. */
      409: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Conteúdo ou slug semanticamente inválido. */
      422: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Falha interna inesperada. */
      500: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "code": "INTERNAL_ERROR",
           *       "details": null,
           *       "message": "Erro interno do servidor.",
           *       "path": "/api/v1/admin/posts/{id}",
           *       "requestId": "019c2d62-6e90-7000-8000-000000000000",
           *       "statusCode": 500,
           *       "timestamp": "2026-08-27T20:15:00.000Z"
           *     }
           */
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
    };
  };
  adminPosts_update: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @example 019c2d62-6e90-7000-8000-000000000010 */
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['UpdatePostDto'];
      };
    };
    responses: {
      200: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['PostAdminDetailDto'];
        };
      };
      /** @description Dados ou parâmetros inválidos. */
      400: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Autenticação necessária. */
      401: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Acesso exclusivo de administrador. */
      403: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Post não encontrado. */
      404: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Estado ou slug incompatível. */
      409: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Conteúdo ou slug semanticamente inválido. */
      422: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Falha interna inesperada. */
      500: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "code": "INTERNAL_ERROR",
           *       "details": null,
           *       "message": "Erro interno do servidor.",
           *       "path": "/api/v1/admin/posts/{id}",
           *       "requestId": "019c2d62-6e90-7000-8000-000000000000",
           *       "statusCode": 500,
           *       "timestamp": "2026-08-27T20:15:00.000Z"
           *     }
           */
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
    };
  };
  adminPosts_publish: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @example 019c2d62-6e90-7000-8000-000000000010 */
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['PostAdminDetailDto'];
        };
      };
      /** @description Dados ou parâmetros inválidos. */
      400: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Autenticação necessária. */
      401: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Acesso exclusivo de administrador. */
      403: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Post não encontrado. */
      404: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Estado ou slug incompatível. */
      409: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Conteúdo ou slug semanticamente inválido. */
      422: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Falha interna inesperada. */
      500: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "code": "INTERNAL_ERROR",
           *       "details": null,
           *       "message": "Erro interno do servidor.",
           *       "path": "/api/v1/admin/posts/{id}/publish",
           *       "requestId": "019c2d62-6e90-7000-8000-000000000000",
           *       "statusCode": 500,
           *       "timestamp": "2026-08-27T20:15:00.000Z"
           *     }
           */
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
    };
  };
  adminPosts_unpublish: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @example 019c2d62-6e90-7000-8000-000000000010 */
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['PostAdminDetailDto'];
        };
      };
      /** @description Dados ou parâmetros inválidos. */
      400: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Autenticação necessária. */
      401: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Acesso exclusivo de administrador. */
      403: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Post não encontrado. */
      404: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Estado ou slug incompatível. */
      409: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Conteúdo ou slug semanticamente inválido. */
      422: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Falha interna inesperada. */
      500: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "code": "INTERNAL_ERROR",
           *       "details": null,
           *       "message": "Erro interno do servidor.",
           *       "path": "/api/v1/admin/posts/{id}/unpublish",
           *       "requestId": "019c2d62-6e90-7000-8000-000000000000",
           *       "statusCode": 500,
           *       "timestamp": "2026-08-27T20:15:00.000Z"
           *     }
           */
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
    };
  };
  adminPosts_archive: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @example 019c2d62-6e90-7000-8000-000000000010 */
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['PostAdminDetailDto'];
        };
      };
      /** @description Dados ou parâmetros inválidos. */
      400: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Autenticação necessária. */
      401: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Acesso exclusivo de administrador. */
      403: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Post não encontrado. */
      404: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Estado ou slug incompatível. */
      409: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Conteúdo ou slug semanticamente inválido. */
      422: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Falha interna inesperada. */
      500: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "code": "INTERNAL_ERROR",
           *       "details": null,
           *       "message": "Erro interno do servidor.",
           *       "path": "/api/v1/admin/posts/{id}/archive",
           *       "requestId": "019c2d62-6e90-7000-8000-000000000000",
           *       "statusCode": 500,
           *       "timestamp": "2026-08-27T20:15:00.000Z"
           *     }
           */
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
    };
  };
  adminPosts_restore: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @example 019c2d62-6e90-7000-8000-000000000010 */
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['PostAdminDetailDto'];
        };
      };
      /** @description Dados ou parâmetros inválidos. */
      400: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Autenticação necessária. */
      401: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Acesso exclusivo de administrador. */
      403: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Post não encontrado. */
      404: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Estado ou slug incompatível. */
      409: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Conteúdo ou slug semanticamente inválido. */
      422: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Falha interna inesperada. */
      500: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "code": "INTERNAL_ERROR",
           *       "details": null,
           *       "message": "Erro interno do servidor.",
           *       "path": "/api/v1/admin/posts/{id}/restore",
           *       "requestId": "019c2d62-6e90-7000-8000-000000000000",
           *       "statusCode": 500,
           *       "timestamp": "2026-08-27T20:15:00.000Z"
           *     }
           */
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
    };
  };
  contact_create: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['CreateContactMessageDto'];
      };
    };
    responses: {
      202: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ContactAcceptedResponseDto'];
        };
      };
      /** @description Dados ou parâmetros inválidos. */
      400: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "code": "VALIDATION_ERROR",
           *       "details": null,
           *       "message": "Dados inválidos.",
           *       "path": "/api/v1/contact",
           *       "requestId": "019c2d62-6e90-7000-8000-000000000000",
           *       "statusCode": 400,
           *       "timestamp": "2026-08-27T20:15:00.000Z"
           *     }
           */
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Dados inválidos. */
      422: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Limite de mensagens de contato excedido. */
      429: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Falha interna inesperada. */
      500: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "code": "INTERNAL_ERROR",
           *       "details": null,
           *       "message": "Erro interno do servidor.",
           *       "path": "/api/v1/contact",
           *       "requestId": "019c2d62-6e90-7000-8000-000000000000",
           *       "statusCode": 500,
           *       "timestamp": "2026-08-27T20:15:00.000Z"
           *     }
           */
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
    };
  };
  engagement_setReaction: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @example 019c2d62-6e90-7000-8000-000000000010 */
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['SetReactionDto'];
      };
    };
    responses: {
      200: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ReactionResponseDto'];
        };
      };
      /** @description Dados ou parâmetros inválidos. */
      400: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Autenticação necessária. */
      401: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Perfil inativo ou sem acesso. */
      403: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Post não encontrado ou não publicado. */
      404: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Falha interna inesperada. */
      500: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "code": "INTERNAL_ERROR",
           *       "details": null,
           *       "message": "Erro interno do servidor.",
           *       "path": "/api/v1/posts/{id}/reaction",
           *       "requestId": "019c2d62-6e90-7000-8000-000000000000",
           *       "statusCode": 500,
           *       "timestamp": "2026-08-27T20:15:00.000Z"
           *     }
           */
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
    };
  };
  engagement_removeReaction: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @example 019c2d62-6e90-7000-8000-000000000010 */
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      204: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Dados ou parâmetros inválidos. */
      400: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Autenticação necessária. */
      401: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Perfil inativo ou sem acesso. */
      403: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Post não encontrado ou não publicado. */
      404: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Falha interna inesperada. */
      500: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "code": "INTERNAL_ERROR",
           *       "details": null,
           *       "message": "Erro interno do servidor.",
           *       "path": "/api/v1/posts/{id}/reaction",
           *       "requestId": "019c2d62-6e90-7000-8000-000000000000",
           *       "statusCode": 500,
           *       "timestamp": "2026-08-27T20:15:00.000Z"
           *     }
           */
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
    };
  };
  engagement_listBookmarks: {
    parameters: {
      query?: {
        /** @example 1 */
        page?: number;
        /** @example 12 */
        limit?: number;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['PaginatedPostSummaryDto'];
        };
      };
      /** @description Dados ou parâmetros inválidos. */
      400: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Autenticação necessária. */
      401: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Perfil inativo ou sem acesso. */
      403: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Falha interna inesperada. */
      500: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "code": "INTERNAL_ERROR",
           *       "details": null,
           *       "message": "Erro interno do servidor.",
           *       "path": "/api/v1/bookmarks",
           *       "requestId": "019c2d62-6e90-7000-8000-000000000000",
           *       "statusCode": 500,
           *       "timestamp": "2026-08-27T20:15:00.000Z"
           *     }
           */
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
    };
  };
  engagement_saveBookmark: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @example 019c2d62-6e90-7000-8000-000000000010 */
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['BookmarkResponseDto'];
        };
      };
      /** @description Dados ou parâmetros inválidos. */
      400: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Autenticação necessária. */
      401: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Perfil inativo ou sem acesso. */
      403: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Post não encontrado ou não publicado. */
      404: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Falha interna inesperada. */
      500: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "code": "INTERNAL_ERROR",
           *       "details": null,
           *       "message": "Erro interno do servidor.",
           *       "path": "/api/v1/posts/{id}/bookmark",
           *       "requestId": "019c2d62-6e90-7000-8000-000000000000",
           *       "statusCode": 500,
           *       "timestamp": "2026-08-27T20:15:00.000Z"
           *     }
           */
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
    };
  };
  engagement_removeBookmark: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @example 019c2d62-6e90-7000-8000-000000000010 */
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      204: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Dados ou parâmetros inválidos. */
      400: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Autenticação necessária. */
      401: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Perfil inativo ou sem acesso. */
      403: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Falha interna inesperada. */
      500: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "code": "INTERNAL_ERROR",
           *       "details": null,
           *       "message": "Erro interno do servidor.",
           *       "path": "/api/v1/posts/{id}/bookmark",
           *       "requestId": "019c2d62-6e90-7000-8000-000000000000",
           *       "statusCode": 500,
           *       "timestamp": "2026-08-27T20:15:00.000Z"
           *     }
           */
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
    };
  };
  health_check: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description A API está ativa. */
      200: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['HealthResponseDto'];
        };
      };
      /** @description Falha interna inesperada. */
      500: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "code": "INTERNAL_ERROR",
           *       "details": null,
           *       "message": "Erro interno do servidor.",
           *       "path": "/api/v1/health",
           *       "requestId": "019c2d62-6e90-7000-8000-000000000000",
           *       "statusCode": 500,
           *       "timestamp": "2026-08-27T20:15:00.000Z"
           *     }
           */
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
    };
  };
  health_checkReadiness: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description A API está pronta para receber tráfego. */
      200: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ReadinessResponseDto'];
        };
      };
      /** @description Falha interna inesperada. */
      500: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "code": "INTERNAL_ERROR",
           *       "details": null,
           *       "message": "Erro interno do servidor.",
           *       "path": "/api/v1/health/ready",
           *       "requestId": "019c2d62-6e90-7000-8000-000000000000",
           *       "statusCode": 500,
           *       "timestamp": "2026-08-27T20:15:00.000Z"
           *     }
           */
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description A API ainda não consegue acessar o banco de dados. */
      503: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ReadinessResponseDto'];
        };
      };
    };
  };
  adminMedia_upload: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'multipart/form-data': {
          /** @example Diagrama da arquitetura da aplicação */
          altText: string;
          /** Format: binary */
          file: string;
        };
      };
    };
    responses: {
      201: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['MediaResponseDto'];
        };
      };
      /** @description Arquivo ou texto alternativo inválido. */
      400: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Autenticação necessária. */
      401: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Acesso exclusivo de administrador. */
      403: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Arquivo maior que 10 MB. */
      413: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Conteúdo, MIME ou extensão não suportado. */
      415: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Falha interna inesperada. */
      500: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "code": "INTERNAL_ERROR",
           *       "details": null,
           *       "message": "Erro interno do servidor.",
           *       "path": "/api/v1/admin/media",
           *       "requestId": "019c2d62-6e90-7000-8000-000000000000",
           *       "statusCode": 500,
           *       "timestamp": "2026-08-27T20:15:00.000Z"
           *     }
           */
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
    };
  };
  newsletter_subscribe: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['SubscribeNewsletterDto'];
      };
    };
    responses: {
      202: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['SubscriptionAcceptedResponseDto'];
        };
      };
      /** @description Dados ou parâmetros inválidos. */
      400: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "code": "VALIDATION_ERROR",
           *       "details": null,
           *       "message": "Dados inválidos.",
           *       "path": "/api/v1/newsletter/subscriptions",
           *       "requestId": "019c2d62-6e90-7000-8000-000000000000",
           *       "statusCode": 400,
           *       "timestamp": "2026-08-27T20:15:00.000Z"
           *     }
           */
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Dados inválidos. */
      422: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Limite de solicitações da newsletter excedido. */
      429: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Falha interna inesperada. */
      500: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "code": "INTERNAL_ERROR",
           *       "details": null,
           *       "message": "Erro interno do servidor.",
           *       "path": "/api/v1/newsletter/subscriptions",
           *       "requestId": "019c2d62-6e90-7000-8000-000000000000",
           *       "statusCode": 500,
           *       "timestamp": "2026-08-27T20:15:00.000Z"
           *     }
           */
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
    };
  };
  newsletter_confirm: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ConfirmSubscriptionDto'];
      };
    };
    responses: {
      200: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['SubscriptionConfirmedResponseDto'];
        };
      };
      /** @description Token inválido. */
      400: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Token expirado. */
      410: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Limite de solicitações da newsletter excedido. */
      429: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Falha interna inesperada. */
      500: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "code": "INTERNAL_ERROR",
           *       "details": null,
           *       "message": "Erro interno do servidor.",
           *       "path": "/api/v1/newsletter/subscriptions/confirm",
           *       "requestId": "019c2d62-6e90-7000-8000-000000000000",
           *       "statusCode": 500,
           *       "timestamp": "2026-08-27T20:15:00.000Z"
           *     }
           */
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
    };
  };
  newsletter_unsubscribe: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['UnsubscribeDto'];
      };
    };
    responses: {
      204: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Dados ou parâmetros inválidos. */
      400: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "code": "VALIDATION_ERROR",
           *       "details": null,
           *       "message": "Dados inválidos.",
           *       "path": "/api/v1/newsletter/subscriptions/unsubscribe",
           *       "requestId": "019c2d62-6e90-7000-8000-000000000000",
           *       "statusCode": 400,
           *       "timestamp": "2026-08-27T20:15:00.000Z"
           *     }
           */
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Limite de solicitações da newsletter excedido. */
      429: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Falha interna inesperada. */
      500: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "code": "INTERNAL_ERROR",
           *       "details": null,
           *       "message": "Erro interno do servidor.",
           *       "path": "/api/v1/newsletter/subscriptions/unsubscribe",
           *       "requestId": "019c2d62-6e90-7000-8000-000000000000",
           *       "statusCode": 500,
           *       "timestamp": "2026-08-27T20:15:00.000Z"
           *     }
           */
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
    };
  };
  adminCampaigns_list: {
    parameters: {
      query?: {
        /** @example 1 */
        page?: number;
        /** @example 20 */
        limit?: number;
        /** @example DRAFT */
        status?: components['schemas']['CampaignStatus'];
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['PaginatedEmailCampaignsDto'];
        };
      };
      /** @description Dados ou parâmetros inválidos. */
      400: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Autenticação necessária. */
      401: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Acesso exclusivo de administrador. */
      403: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Falha interna inesperada. */
      500: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "code": "INTERNAL_ERROR",
           *       "details": null,
           *       "message": "Erro interno do servidor.",
           *       "path": "/api/v1/admin/newsletter/campaigns",
           *       "requestId": "019c2d62-6e90-7000-8000-000000000000",
           *       "statusCode": 500,
           *       "timestamp": "2026-08-27T20:15:00.000Z"
           *     }
           */
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
    };
  };
  adminCampaigns_create: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['CreateCampaignDto'];
      };
    };
    responses: {
      201: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['EmailCampaignAdminDto'];
        };
      };
      /** @description Dados ou parâmetros inválidos. */
      400: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Autenticação necessária. */
      401: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Acesso exclusivo de administrador. */
      403: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description O post não está publicado. */
      409: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Conteúdo inválido. */
      422: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Falha interna inesperada. */
      500: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "code": "INTERNAL_ERROR",
           *       "details": null,
           *       "message": "Erro interno do servidor.",
           *       "path": "/api/v1/admin/newsletter/campaigns",
           *       "requestId": "019c2d62-6e90-7000-8000-000000000000",
           *       "statusCode": 500,
           *       "timestamp": "2026-08-27T20:15:00.000Z"
           *     }
           */
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
    };
  };
  adminCampaigns_get: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @example 019c2d62-6e90-7000-8000-000000000010 */
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['EmailCampaignAdminDto'];
        };
      };
      /** @description Dados ou parâmetros inválidos. */
      400: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Autenticação necessária. */
      401: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Acesso exclusivo de administrador. */
      403: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Campanha não encontrada. */
      404: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Falha interna inesperada. */
      500: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "code": "INTERNAL_ERROR",
           *       "details": null,
           *       "message": "Erro interno do servidor.",
           *       "path": "/api/v1/admin/newsletter/campaigns/{id}",
           *       "requestId": "019c2d62-6e90-7000-8000-000000000000",
           *       "statusCode": 500,
           *       "timestamp": "2026-08-27T20:15:00.000Z"
           *     }
           */
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
    };
  };
  adminCampaigns_update: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @example 019c2d62-6e90-7000-8000-000000000010 */
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['UpdateCampaignDto'];
      };
    };
    responses: {
      200: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['EmailCampaignAdminDto'];
        };
      };
      /** @description Dados ou parâmetros inválidos. */
      400: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Autenticação necessária. */
      401: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Acesso exclusivo de administrador. */
      403: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description A campanha não está editável. */
      409: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Falha interna inesperada. */
      500: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "code": "INTERNAL_ERROR",
           *       "details": null,
           *       "message": "Erro interno do servidor.",
           *       "path": "/api/v1/admin/newsletter/campaigns/{id}",
           *       "requestId": "019c2d62-6e90-7000-8000-000000000000",
           *       "statusCode": 500,
           *       "timestamp": "2026-08-27T20:15:00.000Z"
           *     }
           */
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
    };
  };
  adminCampaigns_send: {
    parameters: {
      query?: never;
      header: {
        /**
         * @description UUID gerado pelo cliente e reutilizado apenas ao repetir a mesma tentativa.
         * @example 019c2d62-6e90-7000-8000-000000000051
         */
        'Idempotency-Key': string;
      };
      path: {
        /** @example 019c2d62-6e90-7000-8000-000000000010 */
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      202: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['EmailCampaignAdminDto'];
        };
      };
      /** @description Dados ou parâmetros inválidos. */
      400: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Autenticação necessária. */
      401: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Acesso exclusivo de administrador. */
      403: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Envio duplicado ou indisponível. */
      409: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Falha interna inesperada. */
      500: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "code": "INTERNAL_ERROR",
           *       "details": null,
           *       "message": "Erro interno do servidor.",
           *       "path": "/api/v1/admin/newsletter/campaigns/{id}/send",
           *       "requestId": "019c2d62-6e90-7000-8000-000000000000",
           *       "statusCode": 500,
           *       "timestamp": "2026-08-27T20:15:00.000Z"
           *     }
           */
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
    };
  };
  resendWebhooks_process: {
    parameters: {
      query?: never;
      header: {
        /**
         * @description Assinatura criptográfica do corpo bruto.
         * @example v1,base64-signature
         */
        'svix-signature': string;
        /**
         * @description Timestamp Unix usado na verificação da assinatura.
         * @example 1787689200
         */
        'svix-timestamp': string;
        /**
         * @description Identificador único do evento enviado pelo Resend.
         * @example msg_2bL7C4Yp9W3x
         */
        'svix-id': string;
      };
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          [key: string]: unknown;
        };
      };
    };
    responses: {
      200: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['WebhookReceivedResponseDto'];
        };
      };
      /** @description Payload inválido. */
      400: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Assinatura inválida. */
      401: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Limite de eventos recebidos excedido. */
      429: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Falha interna inesperada. */
      500: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "code": "INTERNAL_ERROR",
           *       "details": null,
           *       "message": "Erro interno do servidor.",
           *       "path": "/api/v1/webhooks/resend",
           *       "requestId": "019c2d62-6e90-7000-8000-000000000000",
           *       "statusCode": 500,
           *       "timestamp": "2026-08-27T20:15:00.000Z"
           *     }
           */
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
    };
  };
  profiles_getMe: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ProfileResponseDto'];
        };
      };
      /** @description Dados ou parâmetros inválidos. */
      400: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Autenticação necessária. */
      401: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Perfil inativo ou sem acesso. */
      403: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Perfil não encontrado. */
      404: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Falha interna inesperada. */
      500: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "code": "INTERNAL_ERROR",
           *       "details": null,
           *       "message": "Erro interno do servidor.",
           *       "path": "/api/v1/profiles/me",
           *       "requestId": "019c2d62-6e90-7000-8000-000000000000",
           *       "statusCode": 500,
           *       "timestamp": "2026-08-27T20:15:00.000Z"
           *     }
           */
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
    };
  };
  profiles_deleteAccount: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['DeleteAccountDto'];
      };
    };
    responses: {
      204: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Dados ou parâmetros inválidos. */
      400: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Autenticação necessária. */
      401: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Perfil inativo ou sem acesso. */
      403: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Perfil não encontrado. */
      404: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Falha interna inesperada. */
      500: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "code": "INTERNAL_ERROR",
           *       "details": null,
           *       "message": "Erro interno do servidor.",
           *       "path": "/api/v1/profiles/me",
           *       "requestId": "019c2d62-6e90-7000-8000-000000000000",
           *       "statusCode": 500,
           *       "timestamp": "2026-08-27T20:15:00.000Z"
           *     }
           */
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
    };
  };
  profiles_updateMe: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['UpdateProfileDto'];
      };
    };
    responses: {
      200: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ProfileResponseDto'];
        };
      };
      /** @description Dados ou parâmetros inválidos. */
      400: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Autenticação necessária. */
      401: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Perfil inativo ou sem acesso. */
      403: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Perfil não encontrado. */
      404: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Falha interna inesperada. */
      500: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "code": "INTERNAL_ERROR",
           *       "details": null,
           *       "message": "Erro interno do servidor.",
           *       "path": "/api/v1/profiles/me",
           *       "requestId": "019c2d62-6e90-7000-8000-000000000000",
           *       "statusCode": 500,
           *       "timestamp": "2026-08-27T20:15:00.000Z"
           *     }
           */
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
    };
  };
  profiles_uploadAvatar: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'multipart/form-data': {
          /** Format: binary */
          file: string;
        };
      };
    };
    responses: {
      200: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ProfileResponseDto'];
        };
      };
      /** @description Dados ou parâmetros inválidos. */
      400: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Autenticação necessária. */
      401: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Perfil inativo ou sem acesso. */
      403: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Perfil não encontrado. */
      404: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Arquivo maior que 2 MB. */
      413: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Conteúdo, MIME ou extensão não suportado. */
      415: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Falha interna inesperada. */
      500: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "code": "INTERNAL_ERROR",
           *       "details": null,
           *       "message": "Erro interno do servidor.",
           *       "path": "/api/v1/profiles/me/avatar",
           *       "requestId": "019c2d62-6e90-7000-8000-000000000000",
           *       "statusCode": 500,
           *       "timestamp": "2026-08-27T20:15:00.000Z"
           *     }
           */
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
    };
  };
  profiles_removeAvatar: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      204: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Dados ou parâmetros inválidos. */
      400: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Autenticação necessária. */
      401: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Perfil inativo ou sem acesso. */
      403: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Perfil não encontrado. */
      404: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
      /** @description Falha interna inesperada. */
      500: {
        headers: {
          /** @description Identificador usado para correlacionar a requisição nos logs. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "code": "INTERNAL_ERROR",
           *       "details": null,
           *       "message": "Erro interno do servidor.",
           *       "path": "/api/v1/profiles/me/avatar",
           *       "requestId": "019c2d62-6e90-7000-8000-000000000000",
           *       "statusCode": 500,
           *       "timestamp": "2026-08-27T20:15:00.000Z"
           *     }
           */
          'application/json': components['schemas']['ErrorResponseDto'];
        };
      };
    };
  };
}
