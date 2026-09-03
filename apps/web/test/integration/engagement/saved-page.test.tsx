import { render, screen } from '@testing-library/react';
import { ApiClientError } from '@vavito/api-client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import SavedPage, { metadata } from '@web/app/(account)/salvos/page';

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  client: vi.fn<(getAccessToken: () => string) => object>(),
  getPage: vi.fn(),
  redirect: vi.fn(),
}));
vi.mock('@web/lib/auth/authenticated-session', () => ({ getAuthenticatedSession: mocks.session }));
vi.mock('@web/lib/api/api-client', () => ({ createWebAuthenticatedApiClient: mocks.client }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('@web/features/engagement', () => ({
  getBookmarksPage: mocks.getPage,
  BookmarksPageContent: ({ data }: { data: { meta: { total: number } } }) => (
    <p>Biblioteca privada: {data.meta.total}</p>
  ),
}));

describe('rota privada de artigos salvos', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.session.mockResolvedValue({ accessToken: 'token-reader' });
    mocks.client.mockReturnValue({});
    mocks.getPage.mockResolvedValue({
      items: [],
      meta: { limit: 12, page: 1, total: 0, totalPages: 0 },
    });
    mocks.redirect.mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });
  });

  it('exige sessão antes de consultar a biblioteca e evita indexação', async () => {
    mocks.session.mockResolvedValue(null);
    await expect(SavedPage({ searchParams: Promise.resolve({}) })).rejects.toThrow('NEXT_REDIRECT');
    expect(mocks.redirect).toHaveBeenCalledWith('/auth?next=/salvos');
    expect(mocks.getPage).not.toHaveBeenCalled();
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it('consulta somente com a credencial do leitor atual e aceita biblioteca vazia', async () => {
    render(await SavedPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText('Biblioteca privada: 0')).toBeInTheDocument();
    expect(mocks.client.mock.calls[0]?.[0]()).toBe('token-reader');
    expect(mocks.getPage).toHaveBeenCalledWith(1, {});
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it.each(['-1', 'abc', '0', '1.5', '999999999999999999999'])(
    'normaliza página inválida %s',
    async (page) => {
      await SavedPage({ searchParams: Promise.resolve({ page }) });
      expect(mocks.getPage).toHaveBeenCalledWith(1, {});
    },
  );

  it('aceita paginação e retorna à última página quando um item é removido', async () => {
    mocks.getPage.mockResolvedValue({
      items: [],
      meta: { page: 3, limit: 12, total: 24, totalPages: 2 },
    });
    await expect(
      SavedPage({ searchParams: Promise.resolve({ page: ['3', '4'] }) }),
    ).rejects.toThrow('NEXT_REDIRECT');
    expect(mocks.getPage).toHaveBeenCalledWith(3, {});
    expect(mocks.redirect).toHaveBeenCalledWith('/salvos?page=2');
  });

  it('retorna à primeira página quando a biblioteca fica vazia em uma página posterior', async () => {
    await expect(SavedPage({ searchParams: Promise.resolve({ page: '2' }) })).rejects.toThrow(
      'NEXT_REDIRECT',
    );
    expect(mocks.redirect).toHaveBeenCalledWith('/salvos');
  });

  it.each([404, 500])('não confunde erro %s com uma biblioteca vazia', async (status) => {
    mocks.getPage.mockRejectedValue(
      ApiClientError.fromResponse(new Response(null, { status }), { message: 'detalhe interno' }),
    );
    render(await SavedPage({ searchParams: Promise.resolve({}) }));
    expect(
      screen.getByRole('heading', { name: 'Não foi possível carregar seus artigos salvos.' }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Biblioteca privada/)).not.toBeInTheDocument();
    expect(screen.queryByText('detalhe interno')).not.toBeInTheDocument();
  });

  it('não cria um ciclo de redirecionamentos se o servidor rejeitar uma sessão local válida', async () => {
    mocks.getPage.mockRejectedValue(
      ApiClientError.fromResponse(new Response(null, { status: 401 }), {}),
    );
    render(await SavedPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it('limita o carregamento a oito segundos e mostra feedback amigável', async () => {
    vi.useFakeTimers();
    try {
      mocks.getPage.mockReturnValue(new Promise(() => {}));
      const result = SavedPage({ searchParams: Promise.resolve({}) });
      await vi.advanceTimersByTimeAsync(8001);
      render(await result);
      expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
