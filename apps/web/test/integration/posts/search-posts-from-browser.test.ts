import { afterEach, describe, expect, it, vi } from 'vitest';
import { searchPostsFromBrowser } from '@web/features/posts/services/search-posts-from-browser';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('busca no navegador', () => {
  it('usa a mesma origem sem depender de localhost da API no telefone', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json([]));
    vi.stubGlobal('fetch', fetchMock);
    await expect(searchPostsFromBrowser({ query: '  Ação  ' })).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledWith('/api/posts/search?q=a%C3%A7%C3%A3o', {
      signal: expect.any(AbortSignal) as AbortSignal,
    });
  });

  it('interrompe a busca em oito segundos', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url, { signal }: { signal: AbortSignal }) =>
          new Promise((_, reject) => {
            signal.addEventListener('abort', () =>
              reject(new DOMException('Cancelado', 'AbortError')),
            );
          }),
      ),
    );
    const result = searchPostsFromBrowser({ query: 'teste' });
    const assertion = expect(result).rejects.toMatchObject({ name: 'AbortError' });
    await vi.advanceTimersByTimeAsync(8000);
    await assertion;
  });
});
