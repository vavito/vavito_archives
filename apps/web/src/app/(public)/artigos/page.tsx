import type { Metadata } from 'next';

import { ArticlesPageStream, normalizeArticlesSort } from '@web/features/posts';
import { createPublicPageMetadata } from '@web/lib/seo/metadata';

const articlesDescription =
  'Explore todos os artigos do Vavito Archives sobre desenvolvimento, arquitetura e produto.';

interface ArticlesPageProps {
  searchParams: Promise<{
    page?: string | string[];
    sort?: string | string[];
    tag?: string | string[];
  }>;
}

function firstParameter(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parsePage(value: string | undefined): number {
  if (!value || !/^\d+$/.test(value)) {
    return 1;
  }

  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export async function generateMetadata({
  searchParams,
}: Readonly<ArticlesPageProps>): Promise<Metadata> {
  const parameters = await searchParams;
  const page = parsePage(firstParameter(parameters.page));
  const tag = firstParameter(parameters.tag)?.trim().toLowerCase();
  const canonicalParameters = new URLSearchParams();
  const sort = normalizeArticlesSort(firstParameter(parameters.sort));
  if (sort !== 'recent') canonicalParameters.set('sort', sort);

  if (tag) {
    canonicalParameters.set('tag', tag);
  }

  if (page > 1) {
    canonicalParameters.set('page', String(page));
  }

  const query = canonicalParameters.toString();

  return createPublicPageMetadata({
    description: articlesDescription,
    pathname: query ? `/artigos?${query}` : '/artigos',
    title: 'Artigos',
  });
}

export default async function ArticlesPage({ searchParams }: Readonly<ArticlesPageProps>) {
  const parameters = await searchParams;

  return (
    <ArticlesPageStream
      filters={{
        page: parsePage(firstParameter(parameters.page)),
        sort: normalizeArticlesSort(firstParameter(parameters.sort)),
        tag: firstParameter(parameters.tag) ?? null,
      }}
    />
  );
}
