import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ArticleShareButton } from '@web/features/posts/components/article-share-button';

afterEach(() => {
  Reflect.deleteProperty(navigator, 'share');
  Reflect.deleteProperty(navigator, 'clipboard');
  Reflect.deleteProperty(document, 'execCommand');
});

describe('compartilhamento do artigo', () => {
  it('copia o link sem abrir compartilhamento nativo', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { configurable: true, value: share });
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    render(<ArticleShareButton />);

    fireEvent.click(screen.getByRole('button', { name: 'Compartilhar' }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(window.location.href));
    expect(share).not.toHaveBeenCalled();
  });

  it('copia o link quando o compartilhamento nativo não está disponível', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    render(<ArticleShareButton />);

    fireEvent.click(screen.getByRole('button', { name: 'Compartilhar' }));

    expect(await screen.findByRole('button', { name: 'Link copiado' })).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith(window.location.href);
  });

  it('copia em HTTP local sem Clipboard API e remove o campo temporário', async () => {
    const copy = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, 'execCommand', { configurable: true, value: copy });
    render(<ArticleShareButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Compartilhar' }));
    expect(await screen.findByRole('button', { name: 'Link copiado' })).toBeInTheDocument();
    expect(copy).toHaveBeenCalledWith('copy');
    expect(document.querySelector('textarea')).toBeNull();
  });

  it('informa a falha quando o navegador recusa copiar', async () => {
    Object.defineProperty(document, 'execCommand', { configurable: true, value: () => false });
    render(<ArticleShareButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Compartilhar' }));
    expect(await screen.findByText('Não foi possível copiar')).toBeInTheDocument();
  });
});
