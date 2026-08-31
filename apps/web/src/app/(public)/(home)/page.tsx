import type { Metadata } from 'next';

import { PageError } from '@web/components/feedback/page-error';
import { getHomeData, HomePageContent } from '@web/features/home';
import { withPageDataTimeout } from '@web/lib/api/page-data-timeout';

export const metadata: Metadata = {
  description:
    'Artigos sobre desenvolvimento de software, arquitetura, produto e os aprendizados por trás de cada projeto.',
  title: 'Vavito Archives — ideias de quem constrói software',
};

interface HomePageProps {
  searchParams: Promise<{ tag?: string | string[] }>;
}

export default async function HomePage({ searchParams }: Readonly<HomePageProps>) {
  const parameters = await searchParams;
  const selectedTag = Array.isArray(parameters.tag) ? parameters.tag[0] : parameters.tag;
  let data: Awaited<ReturnType<typeof getHomeData>>;

  try {
    data = await withPageDataTimeout(() => getHomeData({ selectedTag: selectedTag ?? null }));
  } catch {
    return (
      <PageError
        description="Não conseguimos buscar os conteúdos agora. Tente novamente em alguns instantes."
        title="Não foi possível carregar os artigos."
      />
    );
  }

  return <HomePageContent data={data} />;
}
