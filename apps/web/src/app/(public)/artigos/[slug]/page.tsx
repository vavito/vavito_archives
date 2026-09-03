import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { cache } from 'react';

import { PageError } from '@web/components/feedback/page-error';
import {
  CommentsSection,
  getCommentsPage,
  type CommentsPageData,
  type CommentViewer,
} from '@web/features/comments';
import { ArticleReactions } from '@web/features/engagement';
import {
  ArticlePageContent,
  createArticleMetadata,
  createArticleStructuredData,
  getArticlePageData,
} from '@web/features/posts';
import { getProfile } from '@web/features/profile';
import { createWebAuthenticatedApiClient } from '@web/lib/api/api-client';
import { withPageDataTimeout } from '@web/lib/api/page-data-timeout';
import {
  type AuthenticatedSession,
  getAuthenticatedSession,
} from '@web/lib/auth/authenticated-session';
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
  const session = await getAuthenticatedSession();
  let data: Awaited<ReturnType<typeof getArticlePageData>>;

  try {
    data = session
      ? await withPageDataTimeout(() =>
          getArticlePageData({
            client: createWebAuthenticatedApiClient(() => session.accessToken),
            slug,
          }),
        )
      : await getArticlePageDataForRoute(slug);
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

  const [comments, viewer] = await Promise.all([
    getInitialComments(data.post.slug),
    getCommentViewer(session),
  ]);

  const structuredData = createArticleStructuredData(data.post);

  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: serializeStructuredData(structuredData) }}
        type="application/ld+json"
      />
      <ArticlePageContent
        articleActions={
          <ArticleReactions
            initialCounts={data.post.reactionCounts}
            initialReaction={data.post.viewer?.reaction ?? null}
            isAuthenticated={data.post.viewer !== null}
            postId={data.post.id}
            slug={data.post.slug}
          />
        }
        data={data}
        engagement={
          <CommentsSection
            initialData={comments}
            postId={data.post.id}
            slug={data.post.slug}
            viewer={viewer}
          />
        }
      />
    </>
  );
}

async function getInitialComments(slug: string): Promise<CommentsPageData | null> {
  try {
    return await getCommentsPage(slug);
  } catch {
    return null;
  }
}

async function getCommentViewer(
  session: AuthenticatedSession | null,
): Promise<CommentViewer | null> {
  if (!session) return null;

  try {
    const profile = await getProfile(createWebAuthenticatedApiClient(() => session.accessToken));
    return {
      avatarUrl: profile.avatarUrl,
      displayName: profile.displayName,
      id: profile.id,
      role: profile.role,
    };
  } catch {
    return null;
  }
}
