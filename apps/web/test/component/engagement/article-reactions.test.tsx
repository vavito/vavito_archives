import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ArticleReactions } from '@web/features/engagement/components/article-reactions';

const serviceMocks = vi.hoisted(() => ({ saveReaction: vi.fn() }));

vi.mock('@web/features/engagement/services/reactions.service', () => ({
  SafeReactionActionError: class SafeReactionActionError extends Error {},
  saveReaction: serviceMocks.saveReaction,
}));

describe('reações do artigo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('solicita autenticação sem alterar os contadores do visitante', async () => {
    render(
      <ArticleReactions
        initialCounts={{ dislike: 1, like: 4 }}
        initialReaction={null}
        isAuthenticated={false}
        postId="post-id"
        slug="artigo"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Gostei, 4' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Entre para participar')).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: /Entrar ou criar conta/ })).toHaveAttribute(
      'href',
      '/auth?next=%2Fartigos%2Fartigo',
    );
    expect(screen.getByRole('button', { hidden: true, name: 'Gostei, 4' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(serviceMocks.saveReaction).not.toHaveBeenCalled();
  });

  it('troca a reação imediatamente e confirma os contadores do servidor', async () => {
    let resolveReaction!: (value: {
      counts: { dislike: number; like: number };
      reaction: 'DISLIKE';
    }) => void;
    serviceMocks.saveReaction.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveReaction = resolve;
      }),
    );
    render(
      <ArticleReactions
        initialCounts={{ dislike: 1, like: 4 }}
        initialReaction="LIKE"
        isAuthenticated
        postId="post-id"
        slug="artigo"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Não gostei, 1' }));

    expect(screen.getByRole('button', { name: 'Gostei, 3' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByRole('button', { name: 'Não gostei, 2' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(serviceMocks.saveReaction).toHaveBeenCalledWith('artigo', 'post-id', 'LIKE', 'DISLIKE');

    resolveReaction({ counts: { dislike: 3, like: 3 }, reaction: 'DISLIKE' });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Não gostei, 3' })).toBeEnabled(),
    );
  });

  it('desfaz a reação ao clicar novamente na opção ativa', async () => {
    serviceMocks.saveReaction.mockResolvedValueOnce(null);
    render(
      <ArticleReactions
        initialCounts={{ dislike: 1, like: 4 }}
        initialReaction="LIKE"
        isAuthenticated
        postId="post-id"
        slug="artigo"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Gostei, 4' }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Gostei, 3' })).toHaveAttribute(
        'aria-pressed',
        'false',
      ),
    );
  });

  it('restaura a reação anterior quando a atualização falha', async () => {
    serviceMocks.saveReaction.mockRejectedValueOnce(new Error('falha'));
    render(
      <ArticleReactions
        initialCounts={{ dislike: 1, like: 4 }}
        initialReaction="LIKE"
        isAuthenticated
        postId="post-id"
        slug="artigo"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Não gostei, 1' }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Gostei, 4' })).toHaveAttribute(
        'aria-pressed',
        'true',
      ),
    );
    expect(screen.getByRole('button', { name: 'Não gostei, 1' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Não foi possível atualizar sua reação agora.',
    );
  });
});
