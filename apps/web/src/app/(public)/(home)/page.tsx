import type { Metadata } from 'next';

import { getHomeData, HomePageContent } from '@web/features/home';

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
  const data = await getHomeData({ selectedTag: selectedTag ?? null });

  return <HomePageContent data={data} />;
}
