import { notFound, permanentRedirect } from 'next/navigation';

import { ArticlePageContent, getArticlePageData } from '@web/features/posts';

export default async function ArticlePage({ params }: PageProps<'/artigos/[slug]'>) {
  const { slug } = await params;
  const data = await getArticlePageData({ slug });

  if (!data) {
    notFound();
  }

  if (data.post.slug !== slug) {
    permanentRedirect(`/artigos/${data.post.slug}`);
  }

  return <ArticlePageContent data={data} />;
}
