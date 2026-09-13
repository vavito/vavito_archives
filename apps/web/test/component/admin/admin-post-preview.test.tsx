import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AdminPostPreview } from '@web/features/admin/components/admin-post-preview';
import type { AdminPostDetail } from '@web/features/admin/types/admin-post.types';

vi.mock('@web/features/admin/actions/admin-post.actions', () => ({
  deleteAdminPostAction: vi.fn(),
  discardAdminPostChangesAction: vi.fn(),
  transitionAdminPostAction: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const post: AdminPostDetail = {
  archivedAt: null,
  author: { displayName: 'João Victor', id: '019c2d62-6e90-7000-8000-000000000002' },
  content: {
    content: [
      {
        content: [{ text: 'Conteúdo ainda não publicado.', type: 'text' }],
        type: 'paragraph',
      },
    ],
    type: 'doc',
  },
  contentSchemaVersion: 1,
  coverAlt: null,
  coverMediaId: null,
  coverPositionX: 50,
  coverPositionY: 50,
  coverScale: 100,
  coverUrl: null,
  createdAt: '2026-09-05T12:00:00.000Z',
  editedAt: null,
  excerpt: 'Resumo privado.',
  hasPendingChanges: false,
  id: '019c2d62-6e90-7000-8000-000000000010',
  publishedAt: null,
  readingTimeMinutes: 1,
  seoDescription: null,
  seoTitle: null,
  slug: 'meu-rascunho',
  status: 'DRAFT',
  tagNames: ['Arquitetura'],
  tags: [{ id: 'tag-1', name: 'Arquitetura', slug: 'arquitetura' }],
  title: 'Meu rascunho',
  updatedAt: '2026-09-05T13:00:00.000Z',
  viewCount: 0,
};

describe('preview administrativo do artigo', () => {
  it('renderiza o conteúdo de um rascunho sem ações públicas', () => {
    render(<AdminPostPreview post={post} />);

    expect(screen.getByText(/Preview protegido/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: post.title })).toBeInTheDocument();
    expect(screen.getByText('Conteúdo ainda não publicado.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Editar' })).toHaveAttribute(
      'href',
      `/admin?post=${post.id}`,
    );
  });
});
