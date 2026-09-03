import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CommentsSection } from '@web/features/comments/components/comments-section';
import type {
  CommentItem,
  CommentsPageData,
  CommentViewer,
} from '@web/features/comments/types/comments.types';

const serviceMocks = vi.hoisted(() => ({
  editComment: vi.fn(),
  loadComments: vi.fn(),
  publishComment: vi.fn(),
  removeComment: vi.fn(),
}));

vi.mock('@web/features/comments/services/comments.service', () => ({
  SafeCommentActionError: class SafeCommentActionError extends Error {},
  editComment: serviceMocks.editComment,
  loadComments: serviceMocks.loadComments,
  publishComment: serviceMocks.publishComment,
  removeComment: serviceMocks.removeComment,
}));

const viewer: CommentViewer = {
  avatarUrl: null,
  displayName: 'Maria',
  id: 'user-id',
  role: 'USER',
};

const comment: CommentItem = {
  author: viewer,
  content: 'Comentário original',
  createdAt: '2026-09-03T12:00:00.000Z',
  edited: true,
  editedAt: '2026-09-03T12:10:00.000Z',
  id: 'comment-id',
  parentId: null,
  postId: 'post-id',
  replies: [
    {
      author: { avatarUrl: null, displayName: 'João', id: 'other-id' },
      content: 'Resposta direta',
      createdAt: '2026-09-03T12:05:00.000Z',
      edited: false,
      editedAt: null,
      id: 'reply-id',
      parentId: 'comment-id',
      postId: 'post-id',
      replies: [],
      status: 'VISIBLE',
    },
  ],
  status: 'VISIBLE',
};

const data: CommentsPageData = {
  items: [comment],
  meta: { limit: 20, page: 1, total: 1, totalPages: 1 },
};

describe('seção de comentários', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    serviceMocks.editComment.mockResolvedValue({
      ...comment,
      content: 'Comentário atualizado',
      edited: true,
    });
    serviceMocks.publishComment.mockResolvedValue({
      ...comment,
      content: 'Novo comentário',
      edited: false,
      editedAt: null,
      id: 'new-comment-id',
      replies: [],
    });
    serviceMocks.removeComment.mockResolvedValue(undefined);
  });

  it('exibe threads, marca edição e não permite um terceiro nível', () => {
    render(<CommentsSection initialData={data} postId="post-id" slug="artigo" viewer={viewer} />);

    expect(screen.getByText('Comentário original')).toBeInTheDocument();
    expect(screen.getByText('editado')).toBeInTheDocument();
    expect(screen.getByText('Resposta direta')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Responder' })).toHaveLength(1);
  });

  it('abre a autenticação contextual quando um visitante tenta comentar', async () => {
    render(<CommentsSection initialData={data} postId="post-id" slug="artigo" viewer={null} />);

    fireEvent.change(screen.getByLabelText('Deixe seu comentário'), {
      target: { value: 'Quero participar' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Comentar' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Entre para participar')).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: /Entrar ou criar conta/ })).toHaveAttribute(
      'href',
      '/auth?next=%2Fartigos%2Fartigo',
    );
    expect(serviceMocks.publishComment).not.toHaveBeenCalled();
  });

  it('publica otimisticamente e confirma o resultado retornado pelo servidor', async () => {
    let resolvePublish!: (value: CommentItem) => void;
    serviceMocks.publishComment.mockReturnValueOnce(
      new Promise<CommentItem>((resolve) => {
        resolvePublish = resolve;
      }),
    );
    render(<CommentsSection initialData={data} postId="post-id" slug="artigo" viewer={viewer} />);

    fireEvent.change(screen.getByLabelText('Deixe seu comentário'), {
      target: { value: 'Novo comentário' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Comentar' }));

    expect(screen.getAllByText('Novo comentário')).toHaveLength(2);
    resolvePublish({
      ...comment,
      content: 'Novo comentário',
      edited: false,
      editedAt: null,
      id: 'new-comment-id',
      replies: [],
    });

    await waitFor(() => expect(serviceMocks.publishComment).toHaveBeenCalled());
    expect(await screen.findByRole('status')).toHaveTextContent('Comentário publicado.');
  });

  it('restaura o conteúdo anterior quando uma edição falha', async () => {
    serviceMocks.editComment.mockRejectedValueOnce(new Error('falha'));
    render(<CommentsSection initialData={data} postId="post-id" slug="artigo" viewer={viewer} />);

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    const editor = screen.getByLabelText('Editar comentário');
    fireEvent.change(editor, { target: { value: 'Alteração otimista' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(serviceMocks.editComment).toHaveBeenCalled());
    expect(screen.getByText('Comentário original')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Não foi possível editar seu comentário agora.',
    );
  });

  it('remove a criação otimista quando a publicação falha', async () => {
    serviceMocks.publishComment.mockRejectedValueOnce(new Error('falha'));
    render(<CommentsSection initialData={data} postId="post-id" slug="artigo" viewer={viewer} />);

    fireEvent.change(screen.getByLabelText('Deixe seu comentário'), {
      target: { value: 'Comentário que falhou' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Comentar' }));

    await waitFor(() => expect(serviceMocks.publishComment).toHaveBeenCalled());
    expect(screen.queryByText('Comentário que falhou', { selector: 'p' })).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Não foi possível publicar seu comentário agora.',
    );
  });

  it('permite que o administrador exclua sem oferecer edição de outro autor', () => {
    render(
      <CommentsSection
        initialData={data}
        postId="post-id"
        slug="artigo"
        viewer={{ ...viewer, id: 'admin-id', role: 'ADMIN' }}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Excluir' })).toHaveLength(2);
  });

  it('restaura a thread quando a exclusão falha', async () => {
    serviceMocks.removeComment.mockRejectedValueOnce(new Error('falha'));
    render(<CommentsSection initialData={data} postId="post-id" slug="artigo" viewer={viewer} />);

    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Excluir' }));

    await waitFor(() =>
      expect(serviceMocks.removeComment).toHaveBeenCalledWith('artigo', comment.id),
    );
    expect(screen.getByText('Comentário original')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Não foi possível excluir seu comentário agora.',
    );
  });
});
