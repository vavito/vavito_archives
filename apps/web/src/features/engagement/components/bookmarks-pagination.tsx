import { buttonVariants } from '@vavito/ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export function BookmarksPagination({
  page,
  totalPages,
}: Readonly<{ page: number; totalPages: number }>) {
  if (totalPages <= 1) return null;
  return (
    <nav
      aria-label="Paginação dos artigos salvos"
      className="flex flex-wrap items-center justify-between gap-4 border-t border-divider pt-6"
    >
      {page > 1 ? (
        <Link
          className={buttonVariants({ size: 'small', variant: 'secondary' })}
          href={{ pathname: '/salvos', query: { page: page - 1 } }}
          rel="prev"
        >
          <ChevronLeft aria-hidden="true" />
          Anterior
        </Link>
      ) : (
        <span />
      )}
      <p className="text-neutral-500 font-mono text-xs" role="status">
        Página {page} de {totalPages}
      </p>
      {page < totalPages ? (
        <Link
          className={buttonVariants({ size: 'small', variant: 'secondary' })}
          href={{ pathname: '/salvos', query: { page: page + 1 } }}
          rel="next"
        >
          Próxima
          <ChevronRight aria-hidden="true" />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
