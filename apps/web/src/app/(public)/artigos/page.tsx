import type { Metadata } from 'next';

import { ArticlesPageContent, getArticlesData } from '@web/features/posts';

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
  const data = await getArticlesData({
    filters: {
      page: parsePage(firstParameter(parameters.page)),
      tag: firstParameter(parameters.tag) ?? null,
    },
  });

  return <ArticlesPageContent data={data} />;
}
