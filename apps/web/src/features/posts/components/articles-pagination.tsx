import { buttonVariants, cn } from '@vavito/ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';

interface ArticlesPaginationProps {
  currentPage: number;
  selectedTag: string | null;
  sort?: string | undefined;
  totalPages: number;
}

function articlesUrl(page: number, selectedTag: string | null, sort: string): Route {
  const query = new URLSearchParams();
  if (sort !== 'recent') query.set('sort', sort);

  if (selectedTag) {
    query.set('tag', selectedTag);
  }

  if (page > 1) {
    query.set('page', page.toString());
  }

  const serializedQuery = query.toString();
  return serializedQuery ? `/artigos?${serializedQuery}` : '/artigos';
}

export function ArticlesPagination({
  currentPage,
  selectedTag,
  sort = 'recent',
  totalPages,
}: Readonly<ArticlesPaginationProps>) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Paginação dos artigos"
      className="flex flex-wrap items-center justify-between gap-4 border-t border-divider pt-6"
    >
      {currentPage > 1 ? (
        <Link
          aria-label="Ir para a página anterior"
          className={cn(buttonVariants({ size: 'small', variant: 'secondary' }))}
          href={articlesUrl(currentPage - 1, selectedTag, sort)}
          rel="prev"
        >
          <ChevronLeft aria-hidden="true" />
          Anterior
        </Link>
      ) : (
        <span aria-hidden="true" className="w-[6.875rem]" />
      )}

      <p className="text-neutral-500 font-mono text-xs" role="status">
        Página <span className="text-neutral-200">{currentPage}</span> de {totalPages}
      </p>

      {currentPage < totalPages ? (
        <Link
          aria-label="Ir para a próxima página"
          className={cn(buttonVariants({ size: 'small', variant: 'secondary' }))}
          href={articlesUrl(currentPage + 1, selectedTag, sort)}
          rel="next"
        >
          Próxima
          <ChevronRight aria-hidden="true" />
        </Link>
      ) : (
        <span aria-hidden="true" className="w-[6.875rem]" />
      )}
    </nav>
  );
}
