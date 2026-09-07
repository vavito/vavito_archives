import { buttonVariants, cn } from '@vavito/ui';
import Link from 'next/link';
import type { Route } from 'next';

interface Props {
  basePath: '/admin/comments' | '/admin/campaigns' | '/admin/campaigns/new';
  page: number;
  totalPages: number;
  filters?: Record<string, string>;
}

export function AdminCommunityPagination({
  basePath,
  page,
  totalPages,
  filters = {},
}: Readonly<Props>) {
  if (totalPages <= 1) return null;
  function url(next: number) {
    return `${basePath}?${new URLSearchParams({ ...filters, page: String(next) })}` as Route;
  }
  return (
    <nav aria-label="Paginação" className="flex items-center justify-between gap-3">
      {page > 1 ? (
        <Link
          href={url(page - 1)}
          className={cn(buttonVariants({ variant: 'secondary', size: 'small' }))}
        >
          Anterior
        </Link>
      ) : (
        <span />
      )}
      <p className="text-sm text-neutral-400">
        Página {page} de {totalPages}
      </p>
      {page < totalPages ? (
        <Link
          href={url(page + 1)}
          className={cn(buttonVariants({ variant: 'secondary', size: 'small' }))}
        >
          Próxima
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
