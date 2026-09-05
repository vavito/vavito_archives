import { ApiClientError } from '@vavito/api-client';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { JSONContent } from '@tiptap/react';

import {
  AdminDraftProvider,
  useAdminDraft,
} from '@web/features/admin/components/admin-draft-provider';
import { AdminDraftWorkspace } from '@web/features/admin/components/admin-draft-workspace';
import { writeActiveAdminDraftId } from '@web/features/admin/services/admin-draft-storage.service';
import type {
  AdminDraftGateway,
  AdminPostDraft,
} from '@web/features/admin/types/admin-draft.types';

const savedContent: JSONContent = {
  content: [
    {
      content: [{ text: 'Conteúdo recuperado', type: 'text' }],
      type: 'paragraph',
    },
  ],
  type: 'doc',
};

const savedDraft: AdminPostDraft = {
  content: savedContent,
  contentSchemaVersion: 1,
  id: '019c2d62-6e90-7000-8000-000000000010',
  slug: 'rascunho-recuperado',
  status: 'DRAFT',
  title: 'Rascunho recuperado',
  updatedAt: '2026-09-05T13:00:00.000Z',
};

function createMemoryStorage() {
  const values = new Map<string, string>();

  return {
    getItem: (key: string) => values.get(key) ?? null,
    removeItem: (key: string) => values.delete(key),
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

function createGateway(overrides: Partial<AdminDraftGateway> = {}): AdminDraftGateway {
  return {
    create: vi.fn().mockResolvedValue(savedDraft),
    get: vi.fn().mockResolvedValue(savedDraft),
    update: vi.fn().mockResolvedValue(savedDraft),
    ...overrides,
  };
}

interface Deferred<T> {
  promise: Promise<T>;
  reject: (reason?: unknown) => void;
  resolve: (value: T) => void;
}

function deferred<T>(): Deferred<T> {
  let reject!: Deferred<T>['reject'];
  let resolve!: Deferred<T>['resolve'];
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, reject, resolve };
}

function DraftHarness() {
  const { draft, errorMessage, isReady, phase, postId, retry, saveNow, setTitle } = useAdminDraft();

  return (
    <div>
      <output data-testid="phase">{phase}</output>
      <output data-testid="post-id">{postId}</output>
      <output data-testid="error">{errorMessage}</output>
      <output data-testid="ready">{String(isReady)}</output>
      <input
        aria-label="Título de teste"
        onChange={(event) => setTitle(event.target.value)}
        value={draft.title}
      />
      <button onClick={retry} type="button">
        Tentar novamente
      </button>
      <button onClick={saveNow} type="button">
        Salvar agora
      </button>
    </div>
  );
}

afterEach(() => {
  vi.useRealTimers();
});

describe('autosave do rascunho administrativo', () => {
  it('recupera do servidor o rascunho ativo ao reabrir o editor', async () => {
    const storage = createMemoryStorage();
    writeActiveAdminDraftId(savedDraft.id, storage);
    const gateway = createGateway();

    render(
      <AdminDraftProvider gateway={gateway} storage={storage}>
        <AdminDraftWorkspace />
      </AdminDraftProvider>,
    );

    expect(await screen.findByDisplayValue(savedDraft.title)).toBeInTheDocument();
    expect(await screen.findByText('Conteúdo recuperado')).toBeInTheDocument();
    expect(gateway.get).toHaveBeenCalledWith(savedDraft.id);
  });

  it('abre diretamente o rascunho solicitado pela listagem administrativa', async () => {
    const storage = createMemoryStorage();
    const gateway = createGateway();

    render(
      <AdminDraftProvider initialPostId={savedDraft.id} gateway={gateway} storage={storage}>
        <AdminDraftWorkspace />
      </AdminDraftProvider>,
    );

    expect(await screen.findByDisplayValue(savedDraft.title)).toBeInTheDocument();
    expect(screen.getByDisplayValue(savedDraft.slug)).toBeInTheDocument();
    expect(gateway.get).toHaveBeenCalledWith(savedDraft.id);
  });

  it('aguarda o debounce antes de criar e atualizar o primeiro rascunho', async () => {
    const storage = createMemoryStorage();
    const gateway = createGateway();
    render(
      <AdminDraftProvider debounceMs={800} gateway={gateway} storage={storage}>
        <DraftHarness />
      </AdminDraftProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('ready')).toHaveTextContent('true'));
    vi.useFakeTimers();

    fireEvent.change(screen.getByLabelText('Título de teste'), {
      target: { value: 'Primeira versão' },
    });
    await act(() => vi.advanceTimersByTimeAsync(799));
    expect(gateway.create).not.toHaveBeenCalled();

    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(gateway.create).toHaveBeenCalledWith('Primeira versão');
    await act(async () => Promise.resolve());
    expect(gateway.update).toHaveBeenCalledWith(
      savedDraft.id,
      expect.objectContaining({ title: 'Primeira versão' }),
    );
    expect(screen.getByTestId('phase')).toHaveTextContent('saved');
  });

  it('serializa os envios e garante que a última versão seja salva por último', async () => {
    const storage = createMemoryStorage();
    writeActiveAdminDraftId(savedDraft.id, storage);
    const firstSave = deferred<AdminPostDraft>();
    const secondSave = deferred<AdminPostDraft>();
    const update = vi
      .fn<AdminDraftGateway['update']>()
      .mockReturnValueOnce(firstSave.promise)
      .mockReturnValueOnce(secondSave.promise);
    const gateway = createGateway({ update });
    render(
      <AdminDraftProvider debounceMs={800} gateway={gateway} storage={storage}>
        <DraftHarness />
      </AdminDraftProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('ready')).toHaveTextContent('true'));
    vi.useFakeTimers();

    fireEvent.change(screen.getByLabelText('Título de teste'), { target: { value: 'Versão A' } });
    await act(() => vi.advanceTimersByTimeAsync(800));
    expect(update).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByLabelText('Título de teste'), { target: { value: 'Versão B' } });
    await act(() => vi.advanceTimersByTimeAsync(800));
    expect(update).toHaveBeenCalledTimes(1);

    await act(async () => {
      firstSave.resolve({ ...savedDraft, title: 'Versão A' });
      await Promise.resolve();
    });
    expect(update).toHaveBeenCalledTimes(2);
    expect(update.mock.calls[1]?.[1]).toMatchObject({ title: 'Versão B' });

    await act(async () => {
      secondSave.resolve({ ...savedDraft, title: 'Versão B' });
      await Promise.resolve();
    });
    expect(screen.getByTestId('phase')).toHaveTextContent('saved');
  });

  it('preserva a versão pendente e permite repetir manualmente após uma falha', async () => {
    const storage = createMemoryStorage();
    writeActiveAdminDraftId(savedDraft.id, storage);
    const update = vi
      .fn<AdminDraftGateway['update']>()
      .mockRejectedValueOnce(new Error('detalhe técnico'))
      .mockResolvedValueOnce(savedDraft);
    const gateway = createGateway({ update });
    render(
      <AdminDraftProvider debounceMs={1} gateway={gateway} storage={storage}>
        <DraftHarness />
      </AdminDraftProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('ready')).toHaveTextContent('true'));

    fireEvent.change(screen.getByLabelText('Título de teste'), {
      target: { value: 'Versão ainda pendente' },
    });
    await waitFor(() => expect(screen.getByTestId('phase')).toHaveTextContent('error'));
    expect(screen.getByTestId('error')).toHaveTextContent(
      'Não foi possível salvar seu rascunho agora. Tente novamente.',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    await waitFor(() => expect(screen.getByTestId('phase')).toHaveTextContent('saved'));
    expect(update).toHaveBeenLastCalledWith(
      savedDraft.id,
      expect.objectContaining({ title: 'Versão ainda pendente' }),
    );
  });

  it('associa o conflito de slug ao campo de endereço sem descartar o rascunho', async () => {
    const storage = createMemoryStorage();
    writeActiveAdminDraftId(savedDraft.id, storage);
    const gateway = createGateway({
      update: vi.fn().mockRejectedValue(
        new ApiClientError({
          code: 'SLUG_ALREADY_EXISTS',
          details: null,
          message: 'Este slug já está em uso.',
          path: '/api/v1/admin/posts/id',
          requestId: null,
          statusCode: 409,
          timestamp: null,
        }),
      ),
    });

    render(
      <AdminDraftProvider debounceMs={1} gateway={gateway} storage={storage}>
        <AdminDraftWorkspace />
      </AdminDraftProvider>,
    );

    const slug = await screen.findByLabelText('Endereço do artigo');
    fireEvent.change(slug, { target: { value: 'endereco-repetido' } });

    expect(
      await screen.findByText('Este endereço já está em uso. Escolha outro para continuar.'),
    ).toBeInTheDocument();
    expect(slug).toHaveAttribute('aria-invalid', 'true');
  });
});
