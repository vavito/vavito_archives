import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { HomePageContent } from '@web/features/home/components/home-page-content';
import type { HomeData } from '@web/features/home/types/home.types';

const homeData: HomeData = {
  popularPosts: [
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
          publishedPostCount: 3,
          slug: 'typescript',
        },
      ],
      title: 'Arquitetura NestJS',
      viewCount: 128,
    },
  ],
  publishedPostsCount: 12,
  recentPosts: [],
  selectedTag: 'typescript',
  tags: [
    {
      id: '019c2d62-6e90-7000-8000-000000000011',
      name: 'TypeScript',
      publishedPostCount: 3,
      slug: 'typescript',
    },
  ],
};

describe('HomePageContent', () => {
  it('apresenta estatísticas reais, filtro ativo e estados vazios', () => {
    render(<HomePageContent data={homeData} />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Ideias e aprendizados de quem constrói software.',
    );
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'TypeScript, 3 artigos' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByText('Nenhum artigo publicado neste recorte.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ler Arquitetura NestJS' })).toBeInTheDocument();
  });
});
