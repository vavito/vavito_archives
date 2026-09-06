import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminPostActions } from '@web/features/admin/components/admin-post-actions';
import type { AdminPostDetail } from '@web/features/admin/types/admin-post.types';

const mocks = vi.hoisted(() => ({ transition: vi.fn() }));

vi.mock('@web/features/admin/actions/admin-post.actions', () => ({
  transitionAdminPostAction: mocks.transition,
}));

const post = {
  id: '019c2d62-6e90-7000-8000-000000000010',
  slug: 'meu-artigo',
  status: 'PUBLISHED',
  title: 'Meu artigo',
} as AdminPostDetail;

describe('ações visuais de artigos', () => {
  beforeEach(() => vi.clearAllMocks());

  it('confirma a publicação e reflete o estado devolvido pelo servidor', async () => {
    mocks.transition.mockResolvedValue({ data: post, message: 'Artigo publicado.', ok: true });
    render(<AdminPostActions initialStatus="DRAFT" postId={post.id} title={post.title} />);

    fireEvent.click(screen.getByRole('button', { name: 'Publicar' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('O artigo ficará disponível');
    fireEvent.click(screen.getByRole('button', { name: 'Publicar agora' }));

    await waitFor(() => expect(mocks.transition).toHaveBeenCalledWith(post.id, 'publish'));
    expect(await screen.findByText('Artigo publicado.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Despublicar' })).toBeInTheDocument();
  });

  it('exige confirmação antes de arquivar', () => {
    render(<AdminPostActions initialStatus="DRAFT" postId={post.id} title={post.title} />);

    fireEvent.click(screen.getByRole('button', { name: 'Arquivar' }));
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'O rascunho deixará o fluxo de edição até ser restaurado.',
    );
    expect(mocks.transition).not.toHaveBeenCalled();
  });
});
