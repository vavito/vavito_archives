import type { PostSummary } from '../types/posts.types';
import { normalizePostSearchQuery } from './search-published-posts';
import { WEB_API_REQUEST_TIMEOUT_MS } from '@web/lib/api/page-data-timeout';

export async function searchPostsFromBrowser({
  query,
  signal,
}: {
  query: string;
  signal?: AbortSignal;
}): Promise<PostSummary[]> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  signal?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(abort, WEB_API_REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(
      `/api/posts/search?q=${encodeURIComponent(normalizePostSearchQuery(query))}`,
      {
        signal: controller.signal,
      },
    );
    if (!response.ok) throw new Error('Não conseguimos buscar os artigos agora. Tente novamente.');
    return (await response.json()) as PostSummary[];
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}
