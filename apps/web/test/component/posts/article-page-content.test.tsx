import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ArticlePageContent } from '@web/features/posts/components/article-page-content';
import type { ArticlePageData } from '@web/features/posts/types/posts.types';

vi.mock('@web/features/posts/services/track-post-view', () => ({
  trackPostView: vi.fn().mockResolvedValue(undefined),
}));

const data: ArticlePageData = {
  post: {
    author: { avatarUrl: null, displayName: 'João Victor' },
    content: {
      content: [
        {
          content: [{ text: 'Conteúdo renderizado no servidor.', type: 'text' }],
          type: 'paragraph',
        },
      ],
      type: 'doc',
    },
    contentSchemaVersion: 1,
    coverAlt: 'Diagrama de arquitetura',
    coverPositionX: 35,
    coverPositionY: 70,
    coverScale: 125,
    coverUrl: 'https://storage.test/media/capa.webp',
    excerpt: 'Uma visão prática da arquitetura.',
    id: '019c2d62-6e90-7000-8000-000000000010',
    publishedAt: '2026-08-20T12:00:00.000Z',
    reactionCounts: { dislike: 0, like: 4 },
    readingTimeMinutes: 6,
    seoDescription: null,
    seoTitle: null,
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
    viewer: null,
  },
  relatedPosts: [
    {
      coverAlt: 'Capa do artigo relacionado',
      coverUrl: 'https://storage.test/media/relacionado.webp',
      excerpt: 'Outro conteúdo sobre TypeScript.',
      id: '019c2d62-6e90-7000-8000-000000000012',
      publishedAt: '2026-08-19T12:00:00.000Z',
      readingTimeMinutes: 4,
      slug: 'typescript-na-pratica',
      tags: [],
      title: 'TypeScript na prática',
      viewCount: 80,
    },
  ],
};

describe('ArticlePageContent', () => {
  it('apresenta capa, metadados, conteúdo, compartilhamento e relacionados', () => {
    render(<ArticlePageContent data={data} />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Arquitetura NestJS' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Diagrama de arquitetura' })).toHaveAttribute(
      'src',
      data.post.coverUrl,
    );
    const cover = screen.getByRole('img', { name: 'Diagrama de arquitetura' });
    expect(cover).toHaveStyle({
      objectPosition: '35% 70%',
      transform: 'scale(1.25)',
      transformOrigin: '35% 70%',
    });
    expect(cover.parentElement).toHaveClass('overflow-hidden', 'rounded-2xl', 'border');
    expect(screen.getByText('Conteúdo renderizado no servidor.')).toBeInTheDocument();
    expect(screen.getByLabelText('Autor do artigo')).toHaveTextContent('João Victor');
    expect(screen.getByLabelText('Iniciais de João Victor')).toHaveTextContent('JV');
    expect(screen.getByRole('progressbar', { name: 'Progresso de leitura' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Compartilhar' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Artigos relacionados' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ler TypeScript na prática' })).toHaveAttribute(
      'href',
      '/artigos/typescript-na-pratica',
    );
    expect(screen.getByRole('img', { name: 'Capa do artigo relacionado' })).toHaveAttribute(
      'src',
      data.relatedPosts[0]?.coverUrl,
    );
  });
});
