import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AdminDraftProvider,
  useAdminDraft,
} from '@web/features/admin/components/admin-draft-provider';
import { AdminEditorHeader } from '@web/features/admin/components/admin-editor-header';
import type {
  AdminDraftGateway,
  AdminPostDraft,
} from '@web/features/admin/types/admin-draft.types';

vi.mock('@web/features/admin/actions/admin-post.actions', () => ({
  transitionAdminPostAction: vi.fn(),
}));

const savedDraft: AdminPostDraft = {
  content: { content: [{ type: 'paragraph' }], type: 'doc' },
  contentSchemaVersion: 1,
  excerpt: 'Resumo salvo',
  id: '019c2d62-6e90-7000-8000-000000000010',
  slug: 'titulo-salvo',
  status: 'DRAFT',
  title: 'Título salvo',
  updatedAt: '2026-09-05T13:00:00.000Z',
};

function HeaderDriver() {
  const { setTitle } = useAdminDraft();

  return (
    <button onClick={() => setTitle('Título pendente')} type="button">
      Alterar título
    </button>
  );
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('cabeçalho do editor administrativo', () => {
  it('informa alterações pendentes, salvamento e sucesso', async () => {
    let finishSave!: (draft: AdminPostDraft) => void;
    const updatePromise = new Promise<AdminPostDraft>((resolve) => {
      finishSave = resolve;
    });
    const gateway: AdminDraftGateway = {
      create: vi.fn().mockResolvedValue(savedDraft),
      get: vi.fn().mockResolvedValue(savedDraft),
      update: vi.fn().mockReturnValue(updatePromise),
    };
    render(
      <AdminDraftProvider debounceMs={800} gateway={gateway}>
        <AdminEditorHeader />
        <HeaderDriver />
      </AdminDraftProvider>,
    );
    await screen.findByText('Comece a escrever para criar o rascunho');
    expect(screen.getByRole('link', { name: 'Visualizar artigo' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    vi.useFakeTimers();

    fireEvent.click(screen.getByRole('button', { name: 'Alterar título' }));
    expect(screen.getByRole('status')).toHaveTextContent('Alterações pendentes');
    expect(screen.getByRole('button', { name: 'Salvar rascunho' })).toBeEnabled();

    await act(() => vi.advanceTimersByTimeAsync(800));
    expect(screen.getByRole('status')).toHaveTextContent('Salvando rascunho');

    await act(async () => {
      finishSave(savedDraft);
      await Promise.resolve();
    });
    expect(screen.getByRole('status')).toHaveTextContent('Rascunho salvo');
    expect(screen.getByRole('link', { name: 'Visualizar artigo' })).toHaveAttribute(
      'href',
      `/admin/posts/${savedDraft.id}/preview`,
    );
  });

  it('oferece nova tentativa quando o salvamento falha', async () => {
    const gateway: AdminDraftGateway = {
      create: vi.fn().mockResolvedValue(savedDraft),
      get: vi.fn().mockResolvedValue(savedDraft),
      update: vi
        .fn<AdminDraftGateway['update']>()
        .mockRejectedValueOnce(new Error('detalhe técnico'))
        .mockResolvedValueOnce(savedDraft),
    };
    render(
      <AdminDraftProvider debounceMs={1} gateway={gateway}>
        <AdminEditorHeader />
        <HeaderDriver />
      </AdminDraftProvider>,
    );
    await screen.findByText('Comece a escrever para criar o rascunho');

    fireEvent.click(screen.getByRole('button', { name: 'Alterar título' }));
    const retryButton = await screen.findByRole('button', { name: 'Tentar novamente' });
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Não foi possível salvar seu rascunho agora.',
    );

    fireEvent.click(retryButton);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Rascunho salvo'));
  });
});
