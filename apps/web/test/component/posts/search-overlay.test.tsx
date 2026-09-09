import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { components } from '@vavito/api-client';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SearchOverlay } from '@web/features/posts/components/search-overlay';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  searchPublishedPosts: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock('@web/features/posts/services/search-posts-from-browser', () => ({
  searchPostsFromBrowser: mocks.searchPublishedPosts,
}));

const post: components['schemas']['PostSummaryDto'] = {
  coverAlt: null,
  coverUrl: null,
  excerpt: 'Uma visão prática da arquitetura.',
  id: '019c2d62-6e90-7000-8000-000000000010',
  publishedAt: '2026-08-20T12:00:00.000Z',
  readingTimeMinutes: 6,
  slug: 'arquitetura-nestjs',
  tags: [],
  title: 'Arquitetura NestJS',
  viewCount: 128,
};

function renderSearchOverlay() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(<SearchOverlay />, {
    wrapper: ({ children }: Readonly<{ children: ReactNode }>) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
}

describe('SearchOverlay', () => {
  beforeEach(() => {
    mocks.push.mockReset();
    mocks.searchPublishedPosts.mockReset();
    mocks.searchPublishedPosts.mockResolvedValue([]);
  });

  afterEach(() => {
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: undefined,
    });
  });

  it('acompanha a área visível quando o teclado virtual abre', async () => {
    const viewport = new EventTarget() as EventTarget & {
      height: number;
      offsetTop: number;
    };
    viewport.height = 720;
    viewport.offsetTop = 0;
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: viewport,
    });
    renderSearchOverlay();

    fireEvent.click(screen.getByRole('button', { name: 'Buscar artigos' }));
    const dialog = screen.getByRole('dialog', { name: 'Buscar artigos' });
    await waitFor(() => expect(dialog).toHaveStyle({ maxHeight: '696px', top: '360px' }));

    viewport.height = 420;
    viewport.offsetTop = 20;
    await act(() => {
      viewport.dispatchEvent(new Event('resize'));
      return Promise.resolve();
    });

    await waitFor(() => expect(dialog).toHaveStyle({ maxHeight: '396px', top: '230px' }));
  });

  it('abre com Ctrl+K e fecha com Escape', async () => {
    renderSearchOverlay();

    fireEvent.keyDown(window, { ctrlKey: true, key: 'k' });

    expect(screen.getByRole('dialog', { name: 'Buscar artigos' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Buscar artigos' })).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Buscar artigos' })).not.toBeInTheDocument();
    });
  });

  it('aguarda o debounce antes de consultar os artigos', async () => {
    renderSearchOverlay();
    fireEvent.keyDown(window, { metaKey: true, key: 'k' });

    fireEvent.change(screen.getByRole('combobox', { name: 'Buscar artigos' }), {
      target: { value: 'prisma' },
    });

    expect(mocks.searchPublishedPosts).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(mocks.searchPublishedPosts).toHaveBeenCalledWith(
        expect.objectContaining({ query: 'prisma' }),
      );
    });
  });

  it('limpa o termo sem confundir a ação com o fechamento do modal', () => {
    renderSearchOverlay();
    fireEvent.keyDown(window, { ctrlKey: true, key: 'k' });

    const input = screen.getByRole('combobox', { name: 'Buscar artigos' });
    fireEvent.change(input, { target: { value: 'prisma' } });

    fireEvent.click(screen.getByRole('button', { name: 'Limpar' }));

    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Limpar' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fechar' })).toBeInTheDocument();
  });

  it('navega pelos resultados com as setas e abre o selecionado com Enter', async () => {
    const secondPost = {
      ...post,
      id: '019c2d62-6e90-7000-8000-000000000011',
      slug: 'prisma-com-postgresql',
      title: 'Prisma com PostgreSQL',
    };
    mocks.searchPublishedPosts.mockResolvedValue([post, secondPost]);
    renderSearchOverlay();
    fireEvent.keyDown(window, { ctrlKey: true, key: 'k' });

    const input = screen.getByRole('combobox', { name: 'Buscar artigos' });
    fireEvent.change(input, { target: { value: 'prisma' } });

    await screen.findByRole('option', { name: /Arquitetura NestJS/i });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mocks.push).toHaveBeenCalledWith('/artigos/prisma-com-postgresql');
  });
});
