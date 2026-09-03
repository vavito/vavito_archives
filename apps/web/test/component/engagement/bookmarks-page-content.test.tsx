import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BookmarksPageContent } from '@web/features/engagement/components/bookmarks-page-content';
import type { BookmarksPage } from '@web/features/engagement/types/bookmarks.types';

vi.mock('@web/features/engagement/services/bookmarks.service', () => ({
  saveBookmark: vi.fn(),
  SafeBookmarkActionError: class extends Error {},
}));
const data: BookmarksPage = {
  items: [
    {
      id: 'post-id',
      title: 'Artigo para depois',
      slug: 'artigo',
      excerpt: 'Uma leitura.',
      publishedAt: '2026-09-01T12:00:00Z',
      readingTimeMinutes: 3,
      viewCount: 10,
      tags: [],
      coverUrl: null,
      coverAlt: null,
    },
  ],
  meta: { page: 2, limit: 12, total: 25, totalPages: 3 },
};

describe('biblioteca de artigos salvos', () => {
  it('mostra artigos, remoção e navegação entre páginas privadas', () => {
    render(<BookmarksPageContent data={data} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Artigos salvos' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ler Artigo para depois' })).toHaveAttribute(
      'href',
      '/artigos/artigo',
    );
    expect(screen.getByRole('button', { name: 'Remover dos salvos' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('link', { name: 'Anterior' })).toHaveAttribute(
      'href',
      '/salvos?page=1',
    );
    expect(screen.getByRole('link', { name: 'Próxima' })).toHaveAttribute('href', '/salvos?page=3');
    expect(screen.getByRole('status')).toHaveTextContent('Página 2 de 3');
  });

  it('mostra uma biblioteca vazia, não um erro 404', () => {
    render(
      <BookmarksPageContent
        data={{ items: [], meta: { page: 1, limit: 12, total: 0, totalPages: 0 } }}
      />,
    );
    expect(screen.getByText('Você ainda não salvou nenhum artigo.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explorar artigos' })).toHaveAttribute(
      'href',
      '/artigos',
    );
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('não oferece página anterior no início nem próxima no fim', () => {
    const { rerender } = render(
      <BookmarksPageContent data={{ ...data, meta: { ...data.meta, page: 1 } }} />,
    );
    expect(screen.queryByRole('link', { name: 'Anterior' })).not.toBeInTheDocument();
    rerender(<BookmarksPageContent data={{ ...data, meta: { ...data.meta, page: 3 } }} />);
    expect(screen.queryByRole('link', { name: 'Próxima' })).not.toBeInTheDocument();
  });
});
