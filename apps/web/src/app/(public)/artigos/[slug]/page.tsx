import { notFound, permanentRedirect } from 'next/navigation';

import { PageError } from '@web/components/feedback/page-error';
import { ArticlePageContent, getArticlePageData } from '@web/features/posts';
import { withPageDataTimeout } from '@web/lib/api/page-data-timeout';

export default async function ArticlePage({ params }: PageProps<'/artigos/[slug]'>) {
  const { slug } = await params;
  let data: Awaited<ReturnType<typeof getArticlePageData>>;

  try {
    data = await withPageDataTimeout(() => getArticlePageData({ slug }));
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

  return <ArticlePageContent data={data} />;
}
