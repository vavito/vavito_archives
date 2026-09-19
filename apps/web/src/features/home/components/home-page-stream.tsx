import { chipVariants, cn } from '@vavito/ui';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

import { NewsletterSignup } from '@web/features/newsletter/components/newsletter-signup';
import { createWebCachedPublicApiClient } from '@web/lib/api/api-client';
import {
  getHomePopularPosts,
  getHomePublishedPostsCount,
  getHomeRecentPosts,
  getHomeTags,
} from '../services/get-home-data';
import { ArticleCard } from '@web/features/posts/components/article-card';
import { withPageDataTimeout } from '@web/lib/api/page-data-timeout';

interface HomePageStreamProps {
  selectedTag: string | null;
}

function SectionHeader({
  description,
  id,
  title,
}: Readonly<{ description: string; id: string; title: string }>) {
  return (
    <div className="grid gap-2">
      <h2 className="text-neutral-100 text-2xl font-semibold tracking-tight" id={id}>
        {title}
      </h2>
      <p className="text-neutral-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function EmptyPosts({ selectedTag }: Readonly<{ selectedTag: string | null }>) {
  return (
    <div className="bg-surface-card rounded-2xl border border-dashed border-border p-6 text-center">
      <p className="text-neutral-300 text-sm">Nenhum artigo publicado neste recorte.</p>
      {selectedTag ? (
        <Link className="text-accent mt-2 inline-block text-sm hover:underline" href="/">
          Limpar filtro
        </Link>
      ) : null}
    </div>
  );
}

function SectionError({ label }: Readonly<{ label: string }>) {
  return (
    <div className="border-divider rounded-2xl border border-dashed px-6 py-8 text-center">
      <p className="text-neutral-400 text-sm">Não foi possível carregar {label} agora.</p>
      <p className="text-neutral-600 mt-1 text-xs">Tente novamente em alguns instantes.</p>
    </div>
  );
}

async function resolveSectionData<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await withPageDataTimeout(() => promise);
  } catch {
    return null;
  }
}

function Hero() {
  return (
    <section aria-labelledby="home-title" className="grid gap-8">
      <div className="grid max-w-prose gap-5">
        <p className="text-accent font-mono text-xs tracking-eyebrow uppercase">
          Desenvolvimento · arquitetura · produto
        </p>
        <h1
          className="text-neutral-100 text-[2.125rem] leading-[1.08] font-semibold tracking-[-0.035em] sm:text-5xl"
          id="home-title"
        >
          Ideias e aprendizados de quem constrói software.
        </h1>
        <p className="text-neutral-400 max-w-reading text-base leading-relaxed sm:text-lg">
          Um arquivo vivo sobre decisões técnicas, bastidores de projetos e tudo o que vale a pena
          registrar durante o caminho.
        </p>
        <div>
          <Link
            className="text-neutral-200 hover:text-accent inline-flex items-center gap-2 text-sm font-medium transition-colors"
            href="/artigos"
          >
            Explorar todos os artigos
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function TopicsSkeleton() {
  return (
    <section aria-busy="true" aria-labelledby="topics-title" className="grid gap-5">
      <div className="grid gap-2">
        <h2 className="text-neutral-100 text-base font-semibold" id="topics-title">
          Filtrar por tópico
        </h2>
        <div className="flex gap-2">
          {Array.from({ length: 4 }, (_, index) => (
            <span className="bg-surface-raised h-8 w-20 animate-pulse rounded-full" key={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

async function TopicsSection({ selectedTag }: Readonly<{ selectedTag: string | null }>) {
  const tags = await resolveSectionData(getHomeTags(createWebCachedPublicApiClient()));

  if (!tags) {
    return <SectionError label="os tópicos" />;
  }

  return (
    <section aria-labelledby="topics-title" className="grid gap-5">
      <div className="grid gap-2">
        <h2 className="text-neutral-100 text-base font-semibold" id="topics-title">
          Filtrar por tópico
        </h2>
        <nav aria-label="Filtros de artigos" className="flex flex-wrap gap-2">
          <Link className={cn(chipVariants({ active: !selectedTag }))} href="/">
            Todos
          </Link>
          {tags.map((tag) => (
            <Link
              key={tag.id}
              aria-current={selectedTag === tag.slug ? 'page' : undefined}
              aria-label={
                tag.publishedPostCount === undefined
                  ? tag.name
                  : `${tag.name}, ${tag.publishedPostCount} artigos`
              }
              className={cn(chipVariants({ active: selectedTag === tag.slug }))}
              href={{ pathname: '/', query: { tag: tag.slug } }}
            >
              {tag.name}
              {tag.publishedPostCount !== undefined ? (
                <span className="text-[10px] opacity-70">{tag.publishedPostCount}</span>
              ) : null}
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}

function PostsSkeleton({ count = 3 }: Readonly<{ count?: number }>) {
  return (
    <div aria-busy="true" className="grid">
      {Array.from({ length: count }, (_, index) => (
        <div className="grid animate-pulse gap-3 border-b border-divider px-4 py-6" key={index}>
          <div className="bg-surface-raised h-3 w-44 rounded-full" />
          <div className="bg-surface-raised h-5 w-4/5 rounded-full" />
          <div className="bg-surface-raised h-4 w-full rounded-full" />
          <div className="bg-surface-raised h-3 w-32 rounded-full" />
        </div>
      ))}
    </div>
  );
}

async function RecentSection({
  selectedTag,
}: Readonly<{
  selectedTag: string | null;
}>) {
  const posts = await resolveSectionData(
    getHomeRecentPosts({ client: createWebCachedPublicApiClient(), selectedTag }),
  );

  if (!posts) {
    return <SectionError label="os artigos recentes" />;
  }

  return (
    <section aria-labelledby="recent-posts-title" className="grid gap-7">
      <SectionHeader
        description={
          selectedTag
            ? `Publicações mais recentes em #${selectedTag}.`
            : 'As últimas anotações adicionadas ao arquivo.'
        }
        id="recent-posts-title"
        title="Últimos artigos"
      />
      {posts.items.length > 0 ? (
        <div>
          {posts.items.map((post, index) => (
            <ArticleCard key={post.id} post={post} priority={index === 0} />
          ))}
        </div>
      ) : (
        <EmptyPosts selectedTag={selectedTag} />
      )}
    </section>
  );
}

async function PopularSection({ selectedTag }: Readonly<{ selectedTag: string | null }>) {
  const posts = await resolveSectionData(
    getHomePopularPosts({ client: createWebCachedPublicApiClient(), selectedTag }),
  );

  if (!posts) {
    return <SectionError label="os artigos mais acessados" />;
  }

  return (
    <section aria-labelledby="popular-posts-title" className="grid gap-7">
      <SectionHeader
        description="Os textos mais acessados pelos leitores."
        id="popular-posts-title"
        title="Mais acessados"
      />
      {posts.items.length > 0 ? (
        <div className="bg-surface-card rounded-2xl border border-border p-3 sm:p-4">
          {posts.items.map((post) => (
            <ArticleCard compact key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <EmptyPosts selectedTag={null} />
      )}
    </section>
  );
}

function MetricsSkeleton() {
  return (
    <dl
      aria-busy="true"
      className="mx-auto grid w-full max-w-sm grid-cols-2 gap-4 border-y border-divider py-5 sm:max-w-none sm:grid-cols-3"
    >
      {Array.from({ length: 3 }, (_, index) => (
        <div className={cn('grid gap-1', index === 2 && 'col-span-2 sm:col-span-1')} key={index}>
          <dt className="bg-surface-raised mx-auto h-3 w-28 animate-pulse rounded-full" />
          <dd className="bg-surface-raised mx-auto h-6 w-8 animate-pulse rounded" />
        </div>
      ))}
    </dl>
  );
}

async function MetricsSection({
  selectedTag,
}: Readonly<{
  selectedTag: string | null;
}>) {
  const client = createWebCachedPublicApiClient();
  const recentPostsPromise = getHomeRecentPosts({ client, selectedTag });
  const countPromise = selectedTag
    ? getHomePublishedPostsCount(client)
    : recentPostsPromise.then((posts) => posts.meta.total);
  const metrics = await resolveSectionData(
    Promise.all([countPromise, getHomeTags(client), getHomePopularPosts({ client, selectedTag })]),
  );

  if (!metrics) {
    return <MetricsSkeleton />;
  }

  const [publishedPostsCount, tags, popularPosts] = metrics;
  const mostReadPost = popularPosts.items[0];

  return (
    <dl className="mx-auto grid w-full max-w-sm grid-cols-2 gap-4 border-y border-divider py-5 text-center sm:max-w-none sm:grid-cols-3">
      <div className="grid gap-1">
        <dt className="text-neutral-500 text-xs">Artigos publicados</dt>
        <dd className="text-neutral-100 font-mono text-xl">{publishedPostsCount}</dd>
      </div>
      <div className="grid gap-1">
        <dt className="text-neutral-500 text-xs">Tópicos ativos</dt>
        <dd className="text-neutral-100 font-mono text-xl">{tags.length}</dd>
      </div>
      <div className="col-span-2 grid gap-1 sm:col-span-1">
        <dt className="text-neutral-500 text-xs">Leituras do destaque</dt>
        <dd className="text-neutral-100 font-mono text-xl">
          {mostReadPost?.viewCount.toLocaleString('pt-BR') ?? '0'}
        </dd>
      </div>
    </dl>
  );
}

export function HomePageStream({ selectedTag }: Readonly<HomePageStreamProps>) {
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-16 px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
      <Hero />
      <Suspense fallback={<TopicsSkeleton />}>
        <TopicsSection selectedTag={selectedTag} />
      </Suspense>
      <Suspense fallback={<PostsSkeleton count={4} />}>
        <RecentSection selectedTag={selectedTag} />
      </Suspense>
      <Suspense fallback={<PostsSkeleton count={3} />}>
        <PopularSection selectedTag={selectedTag} />
      </Suspense>
      <Suspense fallback={<MetricsSkeleton />}>
        <MetricsSection selectedTag={selectedTag} />
      </Suspense>
      <NewsletterSignup />
    </div>
  );
}
