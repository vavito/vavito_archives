import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { cache } from 'react';

import { PageError } from '@web/components/feedback/page-error';
import {
  ArticlePageContent,
  createArticleMetadata,
  createArticleStructuredData,
  getArticlePageData,
} from '@web/features/posts';
import { withPageDataTimeout } from '@web/lib/api/page-data-timeout';
import { createPublicPageMetadata } from '@web/lib/seo/metadata';
import { serializeStructuredData } from '@web/lib/seo/structured-data';

const getArticlePageDataForRoute = cache((slug: string) =>
  withPageDataTimeout(() => getArticlePageData({ slug })),
);

export async function generateMetadata({
  params,
}: PageProps<'/artigos/[slug]'>): Promise<Metadata> {
  const { slug } = await params;

  try {
    const data = await getArticlePageDataForRoute(slug);

    if (!data) {
      return {
        description: 'O artigo solicitado não está disponível.',
        robots: { follow: false, index: false },
        title: 'Artigo não encontrado',
      };
    }

    return createArticleMetadata(data.post);
  } catch {
    return createPublicPageMetadata({
      description: 'Leia este artigo no Vavito Archives.',
      pathname: `/artigos/${slug}`,
      title: 'Artigo',
    });
  }
}

export default async function ArticlePage({ params }: PageProps<'/artigos/[slug]'>) {
  const { slug } = await params;
  let data: Awaited<ReturnType<typeof getArticlePageData>>;

  try {
    data = await getArticlePageDataForRoute(slug);
  } catch {
    return (
      <PageError
        description="Não conseguimos abrir este artigo agora. Tente novamente em alguns instantes."
        title="Não foi possível carregar o artigo."
      />
    );
  }

  if (!data) {
    notFound();
  }

  if (data.post.slug !== slug) {
    permanentRedirect(`/artigos/${data.post.slug}`);
  }

  const structuredData = createArticleStructuredData(data.post);

  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: serializeStructuredData(structuredData) }}
        type="application/ld+json"
      />
      <ArticlePageContent data={data} />
    </>
  );
}
