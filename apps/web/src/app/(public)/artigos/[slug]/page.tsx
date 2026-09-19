import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { cache, Suspense } from 'react';

import { PageError } from '@web/components/feedback/page-error';
import {
  CommentsSection,
  getCommentsPage,
  type CommentsPageData,
  type CommentViewer,
} from '@web/features/comments';
import { ArticleReactions, BookmarkButton } from '@web/features/engagement';
import {
  ArticlePageContent,
  createArticleMetadata,
  createArticleStructuredData,
  getArticlePageData,
  getArticleRelatedPosts,
  RelatedPostsSection,
} from '@web/features/posts';
import { getProfile } from '@web/features/profile';
import {
  createWebAuthenticatedApiClient,
  createWebCachedPublicApiClient,
} from '@web/lib/api/api-client';
import { withPageDataTimeout } from '@web/lib/api/page-data-timeout';
import {
  type AuthenticatedSession,
  getAuthenticatedSession,
} from '@web/lib/auth/authenticated-session';
import { createPublicPageMetadata } from '@web/lib/seo/metadata';
import { serializeStructuredData } from '@web/lib/seo/structured-data';

const getArticlePageDataForRoute = cache((slug: string) =>
  withPageDataTimeout(() =>
    getArticlePageData({
      client: createWebCachedPublicApiClient(),
      includeRelatedPosts: false,
      slug,
    }),
  ),
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
  const sessionPromise = getAuthenticatedSession().catch(() => null);
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
      <ArticlePageContent
        articleActions={
          <Suspense fallback={<ArticleActionsLoading />}>
            <ArticleActions post={data.post} sessionPromise={sessionPromise} />
          </Suspense>
        }
        data={data}
        engagement={
          <Suspense fallback={<ArticleSectionLoading label="Carregando comentários" />}>
            <ArticleComments
              postId={data.post.id}
              sessionPromise={sessionPromise}
              slug={data.post.slug}
            />
          </Suspense>
        }
        relatedContent={
          <Suspense fallback={<ArticleSectionLoading label="Carregando artigos relacionados" />}>
            <ArticleRelatedPosts post={data.post} />
          </Suspense>
        }
      />
    </>
  );
}

async function ArticleActions({
  post,
  sessionPromise,
}: {
  post: NonNullable<Awaited<ReturnType<typeof getArticlePageData>>>['post'];
  sessionPromise: Promise<AuthenticatedSession | null>;
}) {
  const session = await sessionPromise;
  let viewerPost = post;

  if (session) {
    try {
      const authenticatedData = await withPageDataTimeout(() =>
        getArticlePageData({
          client: createWebAuthenticatedApiClient(() => session.accessToken),
          includeRelatedPosts: false,
          slug: post.slug,
        }),
      );

      if (authenticatedData) {
        viewerPost = authenticatedData.post;
      }
    } catch {
      // Keep the public post state if personalization is temporarily unavailable.
    }
  }

  return (
    <>
      <ArticleReactions
        initialCounts={viewerPost.reactionCounts}
        initialReaction={viewerPost.viewer?.reaction ?? null}
        isAuthenticated={session !== null}
        postId={viewerPost.id}
        slug={viewerPost.slug}
      />
      <BookmarkButton
        key={`${viewerPost.id}-${viewerPost.viewer?.bookmarked ?? false}`}
        initialBookmarked={viewerPost.viewer?.bookmarked ?? false}
        isAuthenticated={session !== null}
        postId={viewerPost.id}
        slug={viewerPost.slug}
      />
    </>
  );
}

async function ArticleComments({
  postId,
  sessionPromise,
  slug,
}: {
  postId: string;
  sessionPromise: Promise<AuthenticatedSession | null>;
  slug: string;
}) {
  const [comments, session] = await Promise.all([getInitialComments(slug), sessionPromise]);
  const viewer = await getCommentViewer(session);
  return <CommentsSection initialData={comments} postId={postId} slug={slug} viewer={viewer} />;
}

async function ArticleRelatedPosts({
  post,
}: {
  post: NonNullable<Awaited<ReturnType<typeof getArticlePageData>>>['post'];
}) {
  let posts;
  try {
    posts = await withPageDataTimeout(() => getArticleRelatedPosts(post));
  } catch {
    return (
      <p className="mx-auto max-w-6xl px-4 py-8 text-sm text-neutral-400" role="status">
        Não foi possível carregar os artigos relacionados agora.
      </p>
    );
  }
  return <RelatedPostsSection posts={posts} />;
}

function ArticleSectionLoading({ label }: { label: string }) {
  return (
    <div
      aria-busy="true"
      aria-label={label}
      className="mx-auto grid w-full max-w-3xl animate-pulse gap-4 px-4 py-8 sm:px-6 lg:px-8"
      role="status"
    >
      <div className="bg-surface-raised h-6 w-48 rounded-full" />
      <div className="bg-surface-raised h-24 rounded-xl" />
      <span className="sr-only">{label}…</span>
    </div>
  );
}

function ArticleActionsLoading() {
  return (
    <div aria-busy="true" className="flex flex-wrap items-center gap-2" role="status">
      <span className="bg-surface-raised h-9 w-24 animate-pulse rounded-full" />
      <span className="bg-surface-raised h-9 w-20 animate-pulse rounded-full" />
      <span className="sr-only">Carregando ações do artigo…</span>
    </div>
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
