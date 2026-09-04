import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BookmarkButton } from '@web/features/engagement/components/bookmark-button';
import { SafeBookmarkActionError } from '@web/features/engagement/services/bookmarks.service';

const mocks = vi.hoisted(() => ({ save: vi.fn() }));
vi.mock('@web/features/engagement/services/bookmarks.service', () => ({
  saveBookmark: mocks.save,
  SafeBookmarkActionError: class extends Error {},
}));
const props = {
  initialBookmarked: false,
  isAuthenticated: true,
  postId: 'post-id',
  slug: 'artigo',
};

describe('botão de salvar artigo', () => {
  beforeEach(() => vi.resetAllMocks());

  it('orienta o visitante a entrar sem enviar uma mutação', async () => {
    render(<BookmarkButton {...props} isAuthenticated={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Salvar artigo' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('link', { name: /Entrar ou criar conta/ })).toHaveAttribute(
      'href',
      '/auth?next=%2Fartigos%2Fartigo',
    );
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it('salva com feedback imediato, bloqueia cliques repetidos e permite desfazer', async () => {
    let resolve!: (saved: boolean) => void;
    mocks.save.mockReturnValueOnce(
      new Promise<boolean>((done) => {
        resolve = done;
      }),
    );
    render(<BookmarkButton {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Salvar artigo' }));
    const pendingButton = screen.getByRole('button', { name: 'Remover dos salvos' });
    expect(pendingButton).toHaveAttribute('aria-pressed', 'true');
    expect(pendingButton).toBeDisabled();
    expect(pendingButton).toHaveTextContent('Atualizando…');
    fireEvent.click(pendingButton);
    expect(mocks.save).toHaveBeenCalledTimes(1);
    resolve(true);
    await waitFor(() => expect(pendingButton).toBeEnabled());
    mocks.save.mockResolvedValueOnce(false);
    fireEvent.click(pendingButton);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Salvar artigo' })).toBeEnabled(),
    );
    expect(mocks.save).toHaveBeenLastCalledWith('artigo', 'post-id', false);
  });

  it('restaura o salvo e apresenta um aviso flutuante quando a remoção falha', async () => {
    mocks.save.mockRejectedValueOnce(
      new SafeBookmarkActionError('Sua sessão expirou. Entre novamente para continuar.'),
    );
    render(<BookmarkButton {...props} initialBookmarked inLibrary />);
    fireEvent.click(screen.getByRole('button', { name: 'Remover dos salvos' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Sua sessão expirou.');
    expect(screen.getByRole('button', { name: 'Remover dos salvos' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('oculta detalhes técnicos se o transporte da ação falhar', async () => {
    mocks.save.mockRejectedValueOnce(new Error('fetch failed private detail'));
    render(<BookmarkButton {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Salvar artigo' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível atualizar seus artigos salvos agora.',
    );
    expect(screen.getByRole('button', { name: 'Salvar artigo' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
});
