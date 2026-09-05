import { buttonVariants, cn } from '@vavito/ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';

import type { AdminPostsPage } from '../types/admin-post.types';

function pageUrl(data: AdminPostsPage, page: number): Route {
  const query = new URLSearchParams();
  if (data.filters.query) query.set('q', data.filters.query);
  if (data.filters.status) query.set('status', data.filters.status);
  if (page > 1) query.set('page', String(page));
  const serialized = query.toString();
  return serialized ? `/admin/posts?${serialized}` : '/admin/posts';
}

export function AdminPostsPagination({ data }: Readonly<{ data: AdminPostsPage }>) {
  if (data.meta.totalPages <= 1) return null;

  return (
    <nav
      aria-label="Paginação dos artigos administrativos"
      className="flex items-center justify-between gap-4 border-t border-divider pt-6"
    >
      {data.meta.page > 1 ? (
        <Link
          className={cn(buttonVariants({ size: 'small', variant: 'secondary' }))}
          href={pageUrl(data, data.meta.page - 1)}
        >
          <ChevronLeft aria-hidden="true" />
          Anterior
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}
      <p className="text-neutral-500 font-mono text-xs">
        Página <span className="text-neutral-200">{data.meta.page}</span> de {data.meta.totalPages}
      </p>
      {data.meta.page < data.meta.totalPages ? (
        <Link
          className={cn(buttonVariants({ size: 'small', variant: 'secondary' }))}
          href={pageUrl(data, data.meta.page + 1)}
        >
          Próxima
          <ChevronRight aria-hidden="true" />
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}
    </nav>
  );
}
