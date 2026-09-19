import { render, screen, within } from '@testing-library/react';
import { createElement, type ImgHTMLAttributes } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) =>
    createElement('img', {
      ...props,
      alt: typeof props.alt === 'string' ? props.alt : '',
    } as ImgHTMLAttributes<HTMLImageElement>),
}));

import { ArticleCard } from '@web/features/posts/components/article-card';
import type { PostSummary } from '@web/features/posts/types/posts.types';

const post: PostSummary = {
  coverAlt: 'Caderno aberto ao lado de um computador',
  coverPositionX: 50,
  coverPositionY: 50,
  coverScale: 100,
  coverUrl: 'https://cdn.example.com/capa.webp',
  excerpt: 'Um resumo do conteúdo apresentado neste artigo.',
  id: '019c2d62-6e90-7000-8000-000000000010',
  publishedAt: '2026-09-10T12:00:00.000Z',
  readingTimeMinutes: 6,
  slug: 'arquitetura-nestjs',
  tags: [
    {
      id: '019c2d62-6e90-7000-8000-000000000011',
      name: 'Arquitetura',
      slug: 'arquitetura',
    },
  ],
  title: 'Arquitetura NestJS',
  viewCount: 128,
};

function appearsBefore(first: Element, second: Element): boolean {
  return Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);
}

describe('ArticleCard', () => {
  it('mantém capa, título, resumo, tags e estatísticas na ordem editorial', () => {
    render(<ArticleCard post={post} />);

    const card = screen.getByRole('link', { name: 'Ler Arquitetura NestJS' });
    const content = within(card);
    const cover = content.getByRole('img', { name: post.coverAlt as string });
    const title = content.getByRole('heading', { name: post.title });
    const excerpt = content.getByText(post.excerpt);
    const tags = content.getByRole('list', { name: 'Tags do artigo' });
    const metadata = content.getByLabelText('Estatísticas do artigo');

    expect(appearsBefore(cover, title)).toBe(true);
    expect(appearsBefore(title, excerpt)).toBe(true);
    expect(appearsBefore(excerpt, tags)).toBe(true);
    expect(appearsBefore(tags, metadata)).toBe(true);
  });

  it('prioriza somente a capa marcada como principal', () => {
    const { rerender } = render(<ArticleCard post={post} priority />);

    expect(screen.getByRole('img', { name: post.coverAlt as string })).toHaveAttribute(
      'fetchpriority',
      'high',
    );

    rerender(<ArticleCard post={post} />);

    expect(screen.getByRole('img', { name: post.coverAlt as string })).not.toHaveAttribute(
      'fetchpriority',
      'high',
    );
  });
});
