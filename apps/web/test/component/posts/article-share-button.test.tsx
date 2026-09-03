import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ArticleShareButton } from '@web/features/posts/components/article-share-button';

afterEach(() => {
  Reflect.deleteProperty(navigator, 'share');
  Reflect.deleteProperty(navigator, 'clipboard');
});

describe('compartilhamento do artigo', () => {
  it('usa o compartilhamento nativo quando o navegador oferece suporte', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { configurable: true, value: share });
    render(<ArticleShareButton title="Arquitetura NestJS" />);

    fireEvent.click(screen.getByRole('button', { name: 'Compartilhar' }));

    await waitFor(() =>
      expect(share).toHaveBeenCalledWith({
        title: 'Arquitetura NestJS',
        url: window.location.href,
      }),
    );
  });

  it('copia o link quando o compartilhamento nativo não está disponível', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    render(<ArticleShareButton title="Arquitetura NestJS" />);

    fireEvent.click(screen.getByRole('button', { name: 'Compartilhar' }));

    expect(await screen.findByRole('button', { name: 'Link copiado' })).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith(window.location.href);
  });
});
