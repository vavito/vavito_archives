import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PageError } from '@web/components/feedback/page-error';
import { PageLoading } from '@web/components/feedback/page-loading';

describe('feedback de página', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('apresenta um carregamento acessível com skeleton em qualquer viewport', () => {
    render(<PageLoading label="Carregando página de teste" />);

    expect(screen.getByRole('status', { name: 'Carregando página de teste' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
  });

  it('mantém o erro amigável e mostra o feedback antes de tentar novamente', () => {
    vi.useFakeTimers();
    const retry = vi.fn();

    render(<PageError retry={retry} />);

    expect(screen.getByText('Não foi possível carregar o conteúdo.')).toBeInTheDocument();
    expect(screen.queryByText(/API|HTTP|stack|digest/i)).not.toBeInTheDocument();

    const retryButton = screen.getByRole('button', { name: 'Tentar novamente' });

    fireEvent.click(retryButton);

    expect(screen.getByRole('button', { name: 'Tentando novamente…' })).toBeDisabled();
    expect(retryButton.querySelector('svg')).toHaveClass('counterclockwise-spinner');
    expect(retry).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1_999);
    });
    expect(retry).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(retry).toHaveBeenCalledOnce();
  });

  it('inicia o feedback no término do toque em dispositivos móveis', () => {
    vi.useFakeTimers();
    const retry = vi.fn();

    render(<PageError retry={retry} />);

    fireEvent.pointerUp(screen.getByRole('button', { name: 'Tentar novamente' }), {
      pointerType: 'touch',
    });

    expect(screen.getByRole('button', { name: 'Tentando novamente…' })).toBeDisabled();
    expect(retry).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(2_000);
    });

    expect(retry).toHaveBeenCalledOnce();
  });
});
