'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { LoadingSpinner } from '@web/components/feedback/loading-spinner';
import { normalizeArticlesSort } from '../services/articles-sort';

export function ArticlesSortSelect({
  sort = 'recent',
  tag,
}: {
  sort?: string;
  tag: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-center gap-3">
      <label className="text-neutral-400 grid gap-2 text-xs">
        Ordenar por
        <select
          className="bg-surface-card text-neutral-100 rounded-xl border border-border px-3 py-2 text-base focus-visible:outline-2 focus-visible:outline-accent sm:text-sm"
          disabled={pending}
          value={sort}
          onChange={(event) => {
            const params = new URLSearchParams({ sort: normalizeArticlesSort(event.target.value) });
            if (tag) params.set('tag', tag);
            startTransition(() => router.push(`/artigos?${params}`));
          }}
        >
          <option value="recent">Mais novos</option>
          <option value="oldest">Mais antigos</option>
          <option value="popular">Mais acessados</option>
          <option value="least-viewed">Menos acessados</option>
        </select>
      </label>
      {pending ? (
        <span role="status" aria-label="Ordenando artigos">
          <LoadingSpinner />
        </span>
      ) : null}
    </div>
  );
}
