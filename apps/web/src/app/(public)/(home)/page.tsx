import { HomePageStream } from '@web/features/home';
import { createPublicPageMetadata } from '@web/lib/seo/metadata';
import { createWebsiteStructuredData, serializeStructuredData } from '@web/lib/seo/structured-data';

export const metadata = createPublicPageMetadata({
  absoluteTitle: true,
  description:
    'Artigos sobre desenvolvimento de software, arquitetura, produto e os aprendizados por trás de cada projeto.',
  pathname: '/',
  title: 'Vavito Archives — ideias de quem constrói software',
});

interface HomePageProps {
  searchParams: Promise<{ tag?: string | string[] }>;
}

export default async function HomePage({ searchParams }: Readonly<HomePageProps>) {
  const parameters = await searchParams;
  const selectedTag = Array.isArray(parameters.tag) ? parameters.tag[0] : parameters.tag;
  const structuredData = createWebsiteStructuredData();

  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: serializeStructuredData(structuredData) }}
        type="application/ld+json"
      />
      <HomePageStream selectedTag={selectedTag?.trim().toLowerCase() || null} />
    </>
  );
}
