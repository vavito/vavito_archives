import type {
  AdminCampaign,
  AdminCommentsPage,
} from '@web/features/admin/types/admin-community.types';

export const campaignFixture: AdminCampaign = {
  id: '019c2d62-6e90-7000-8000-000000000010',
  audienceCount: 0,
  createdAt: '2026-09-07T12:00:00Z',
  createdById: 'admin',
  failureReason: null,
  htmlSnapshot: '<h1>Leitura da semana</h1><a href="{{unsubscribeUrl}}">Cancelar</a>',
  idempotencyKey: null,
  postSnapshot: {
    id: 'post',
    title: 'Leitura da semana',
    excerpt: 'Resumo',
    slug: 'leitura',
    publishedAt: '2026-09-07T12:00:00Z',
    readingTimeMinutes: 3,
  },
  previewText: 'Uma nova leitura',
  resendId: null,
  sendStartedAt: null,
  sentAt: null,
  status: 'DRAFT',
  subject: 'Leitura da semana',
  updatedAt: '2026-09-07T12:00:00Z',
};

export const commentsFixture: AdminCommentsPage = {
  items: [
    {
      id: 'comment',
      postId: 'post',
      parentId: null,
      content: 'Conversa sobre o artigo',
      status: 'VISIBLE',
      author: { id: 'reader', displayName: 'Leitor', avatarUrl: null },
      moderationReason: null,
      createdAt: '2026-09-07T12:00:00Z',
      editedAt: null,
      deletedAt: null,
    },
  ],
  meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
};
