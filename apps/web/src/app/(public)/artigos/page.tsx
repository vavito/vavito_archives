import type { Metadata } from 'next';

import { PageError } from '@web/components/feedback/page-error';
import { ArticlesPageContent, getArticlesData } from '@web/features/posts';
import { withPageDataTimeout } from '@web/lib/api/page-data-timeout';

export const metadata: Metadata = {
  description:
    'Explore todos os artigos do Vavito Archives sobre desenvolvimento, arquitetura e produto.',
  title: 'Artigos — Vavito Archives',
};

interface ArticlesPageProps {
  searchParams: Promise<{
    page?: string | string[];
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

export default async function ArticlesPage({ searchParams }: Readonly<ArticlesPageProps>) {
  const parameters = await searchParams;
  let data: Awaited<ReturnType<typeof getArticlesData>>;

  try {
    data = await withPageDataTimeout(() =>
      getArticlesData({
        filters: {
          page: parsePage(firstParameter(parameters.page)),
          tag: firstParameter(parameters.tag) ?? null,
        },
      }),
    );
  } catch {
    return (
      <PageError
        description="Não conseguimos buscar os artigos agora. Tente novamente em alguns instantes."
        title="Não foi possível carregar os artigos."
      />
    );
  }

  return <ArticlesPageContent data={data} />;
}
