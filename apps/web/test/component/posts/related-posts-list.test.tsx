import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { RelatedPostsList } from '@web/features/posts/components/related-posts-list';
import type { PostSummary } from '@web/features/posts/types/posts.types';

vi.mock('@web/features/posts/components/article-card', () => ({
  ArticleCard: ({ post }: { post: PostSummary }) => <span>{post.title}</span>,
}));

const posts = ['Primeiro', 'Segundo', 'Terceiro'].map(
  (title, index) =>
    ({
      id: `019c2d62-6e90-7000-8000-00000000001${index}`,
      title,
    }) as PostSummary,
);

describe('RelatedPostsList', () => {
  it('avança e permite voltar um artigo por vez', () => {
    const { container } = render(<RelatedPostsList posts={posts} />);
    const list = container.firstElementChild?.firstElementChild as HTMLDivElement;
    const firstCard = list.firstElementChild as HTMLElement;
    const scrollBy = vi.fn();

    Object.defineProperties(list, {
      clientWidth: { configurable: true, value: 500 },
      scrollBy: { configurable: true, value: scrollBy },
      scrollLeft: { configurable: true, value: 0, writable: true },
      scrollWidth: { configurable: true, value: 900 },
    });
    Object.defineProperty(firstCard, 'offsetWidth', { configurable: true, value: 300 });
    fireEvent.scroll(list);

    fireEvent.click(screen.getByRole('button', { name: 'Ver próximo artigo relacionado' }));
    expect(scrollBy).toHaveBeenLastCalledWith({ behavior: 'smooth', left: 332 });

    list.scrollLeft = 332;
    fireEvent.scroll(list);
    fireEvent.click(screen.getByRole('button', { name: 'Ver artigo relacionado anterior' }));
    expect(scrollBy).toHaveBeenLastCalledWith({ behavior: 'smooth', left: -332 });
  });
});
