import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AdminPostsPageContent } from '@web/features/admin/components/admin-posts-page-content';
import type { AdminPostsPage } from '@web/features/admin/types/admin-post.types';

const data: AdminPostsPage = {
  filters: { page: 1, query: '', status: null },
  items: [
    {
      author: { displayName: 'João Victor', id: '019c2d62-6e90-7000-8000-000000000002' },
      editedAt: null,
      id: '019c2d62-6e90-7000-8000-000000000010',
      publishedAt: null,
      slug: 'meu-rascunho',
      status: 'DRAFT',
      title: 'Meu rascunho',
      updatedAt: '2026-09-05T13:00:00.000Z',
    },
  ],
  meta: { limit: 20, page: 1, total: 1, totalPages: 1 },
};

describe('tela administrativa de artigos', () => {
  it('exibe status e oferece abertura e preview do artigo', () => {
    render(<AdminPostsPageContent data={data} />);

    expect(screen.getByRole('heading', { name: 'Meu rascunho' })).toBeInTheDocument();
    expect(screen.getByText('Rascunho')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Abrir' })).toHaveAttribute(
      'href',
      `/admin?post=${data.items[0]?.id}`,
    );
    expect(screen.getByRole('link', { name: 'Preview' })).toHaveAttribute(
      'href',
      `/admin/posts/${data.items[0]?.id}/preview`,
    );
  });

  it('preserva a busca ao filtrar por status', () => {
    render(
      <AdminPostsPageContent
        data={{ ...data, filters: { page: 1, query: 'arquitetura limpa', status: 'DRAFT' } }}
      />,
    );

    expect(screen.getByRole('link', { name: 'Publicados' })).toHaveAttribute(
      'href',
      '/admin/posts?q=arquitetura+limpa&status=PUBLISHED',
    );
    expect(screen.getByRole('searchbox')).toHaveValue('arquitetura limpa');
  });

  it('apresenta estado vazio com limpeza dos filtros', () => {
    render(
      <AdminPostsPageContent data={{ ...data, items: [], meta: { ...data.meta, total: 0 } }} />,
    );

    expect(screen.getByText('Nenhum artigo encontrado')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Limpar filtros' })).toHaveAttribute(
      'href',
      '/admin/posts',
    );
  });
});
