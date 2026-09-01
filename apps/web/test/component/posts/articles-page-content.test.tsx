import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ArticlesPageContent } from '@web/features/posts/components/articles-page-content';
import type { ArticlesData } from '@web/features/posts/types/posts.types';

const data: ArticlesData = {
  filters: { page: 2, tag: 'typescript' },
  pagination: { limit: 12, page: 2, total: 25, totalPages: 3 },
  posts: [
    {
      coverAlt: null,
      coverUrl: null,
      excerpt: 'Uma visão prática da arquitetura.',
      id: '019c2d62-6e90-7000-8000-000000000010',
      publishedAt: '2026-08-20T12:00:00.000Z',
      readingTimeMinutes: 6,
      slug: 'arquitetura-nestjs',
      tags: [
        {
          id: '019c2d62-6e90-7000-8000-000000000011',
          name: 'TypeScript',
          publishedPostCount: 25,
          slug: 'typescript',
        },
      ],
      title: 'Arquitetura NestJS',
      viewCount: 128,
    },
  ],
  tags: [
    {
      id: '019c2d62-6e90-7000-8000-000000000011',
      name: 'TypeScript',
      publishedPostCount: 25,
      slug: 'typescript',
    },
  ],
};

describe('ArticlesPageContent', () => {
  it('apresenta artigos, filtro ativo e paginação que preserva a tag', () => {
    render(<ArticlesPageContent data={data} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Artigos' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'TypeScript, 25 artigos' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Ler Arquitetura NestJS' })).toHaveAttribute(
      'href',
      '/artigos/arquitetura-nestjs',
    );
    expect(screen.getByRole('link', { name: 'Ir para a página anterior' })).toHaveAttribute(
      'href',
      '/artigos?tag=typescript',
    );
    expect(screen.getByRole('link', { name: 'Ir para a próxima página' })).toHaveAttribute(
      'href',
      '/artigos?tag=typescript&page=3',
    );
  });

  it('orienta o leitor quando o filtro não possui artigos', () => {
    render(
      <ArticlesPageContent
        data={{
          ...data,
          filters: { page: 1, tag: 'typescript' },
          pagination: { limit: 12, page: 1, total: 0, totalPages: 0 },
          posts: [],
        }}
      />,
    );

    expect(screen.getByText('Nenhum artigo encontrado neste tópico.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver todos os artigos' })).toHaveAttribute(
      'href',
      '/artigos',
    );
  });
});
