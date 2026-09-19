import { chipVariants, cn } from '@vavito/ui';
import Link from 'next/link';
import { Suspense } from 'react';

import { withPageDataTimeout } from '@web/lib/api/page-data-timeout';
import { createWebCachedPublicApiClient } from '@web/lib/api/api-client';

import {
  getArticlesListData,
  getArticlesTags,
  type ArticlesListData,
} from '../services/get-articles-data';
import type { ArticlesFilters, TagSummary } from '../types/posts.types';
import { ArticleCard } from './article-card';
import { ArticlesPagination } from './articles-pagination';
import { ArticlesSortSelect } from './articles-sort-select';

interface ArticlesPageStreamProps {
  filters: ArticlesFilters;
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

function ArticlesHeader() {
  return (
    <header className="grid max-w-prose gap-4">
      <p className="text-accent font-mono text-xs tracking-eyebrow uppercase">Arquivo completo</p>
      <h1 className="text-neutral-100 text-[2.125rem] leading-[1.08] font-semibold tracking-[-0.035em] sm:text-4xl">
        Artigos
      </h1>
      <p className="text-neutral-400 text-base leading-relaxed">
        Notas sobre desenvolvimento de software, arquitetura, produto e os aprendizados por trás de
        cada projeto.
      </p>
    </header>
  );
}

function TagsSkeleton() {
  return (
    <section aria-busy="true" aria-labelledby="articles-filter-title" className="grid gap-4">
      <h2 className="text-neutral-100 text-sm font-semibold" id="articles-filter-title">
        Filtrar por tópico
      </h2>
      <div className="flex gap-2">
        {Array.from({ length: 4 }, (_, index) => (
          <span className="bg-surface-raised h-8 w-24 animate-pulse rounded-full" key={index} />
        ))}
      </div>
    </section>
  );
}

function tagHref(filters: ArticlesFilters, tag?: string) {
  return {
    pathname: '/artigos',
    query: {
      ...(tag ? { tag } : {}),
      ...(filters.sort && filters.sort !== 'recent' ? { sort: filters.sort } : {}),
    },
  } as const;
}

async function TagsSection({
  filters,
  tagsPromise,
}: Readonly<{ filters: ArticlesFilters; tagsPromise: Promise<TagSummary[]> }>) {
  const tags = await resolveSectionData(tagsPromise);

  if (!tags) {
    return <SectionError label="os tópicos" />;
  }

  return (
    <section aria-labelledby="articles-filter-title" className="grid gap-4">
      <h2 className="text-neutral-100 text-sm font-semibold" id="articles-filter-title">
        Filtrar por tópico
      </h2>
      <nav aria-label="Filtros da listagem de artigos" className="flex flex-wrap gap-2">
        <Link
          aria-current={!filters.tag ? 'page' : undefined}
          className={cn(chipVariants({ active: !filters.tag }))}
          href={tagHref(filters)}
        >
          Todos
        </Link>
        {tags.map((tag) => (
          <Link
            key={tag.id}
            aria-current={filters.tag === tag.slug ? 'page' : undefined}
            aria-label={
              tag.publishedPostCount === undefined
                ? tag.name
                : `${tag.name}, ${tag.publishedPostCount} artigos`
            }
            className={cn(chipVariants({ active: filters.tag === tag.slug }))}
            href={tagHref(filters, tag.slug)}
          >
            {tag.name}
            {tag.publishedPostCount !== undefined ? (
              <span className="text-[10px] opacity-70">{tag.publishedPostCount}</span>
            ) : null}
          </Link>
        ))}
      </nav>
    </section>
  );
}

function ArticlesListSkeleton() {
  return (
    <section aria-busy="true" aria-labelledby="articles-list-title" className="grid gap-7">
      <div className="grid gap-4">
        <div className="bg-surface-raised h-10 w-48 animate-pulse rounded-xl" />
        <div className="bg-surface-raised h-8 w-64 animate-pulse rounded-xl" />
      </div>
      <div className="grid">
        {Array.from({ length: 5 }, (_, index) => (
          <div className="grid animate-pulse gap-3 border-b border-divider px-4 py-6" key={index}>
            <div className="bg-surface-raised h-3 w-44 rounded-full" />
            <div className="bg-surface-raised h-5 w-4/5 rounded-full" />
            <div className="bg-surface-raised h-4 w-full rounded-full" />
          </div>
        ))}
      </div>
    </section>
  );
}

function EmptyArticles({ data }: Readonly<{ data: ArticlesListData }>) {
  const isPageOutsideResult = data.filters.page > 1;
  const resetHref =
    isPageOutsideResult && data.filters.tag
      ? tagHref(data.filters, data.filters.tag)
      : tagHref(data.filters);

  return (
    <section
      aria-labelledby="empty-articles-title"
      className="bg-surface-card grid justify-items-center gap-3 rounded-2xl border border-dashed border-border px-6 py-12 text-center"
    >
      <p className="text-accent font-mono text-xs tracking-eyebrow uppercase">Arquivo vazio</p>
      <h2 className="text-neutral-100 text-xl font-semibold" id="empty-articles-title">
        {isPageOutsideResult
          ? 'Esta página ainda não tem artigos.'
          : 'Nenhum artigo encontrado neste tópico.'}
      </h2>
      <p className="text-neutral-500 max-w-md text-sm leading-relaxed">
        {isPageOutsideResult
          ? 'Volte ao início da listagem para continuar navegando.'
          : 'Escolha outro tópico ou veja todos os textos publicados.'}
      </p>
      <Link className="text-accent text-sm font-medium hover:underline" href={resetHref}>
        {isPageOutsideResult ? 'Voltar para a primeira página' : 'Ver todos os artigos'}
      </Link>
    </section>
  );
}

async function ArticlesListSection({
  listPromise,
}: Readonly<{ listPromise: Promise<ArticlesListData> }>) {
  const data = await resolveSectionData(listPromise);

  if (!data) {
    return <SectionError label="a listagem de artigos" />;
  }

  return (
    <section aria-labelledby="articles-list-title" className="grid gap-7">
      <ArticlesSortSelect sort={data.filters.sort ?? 'recent'} tag={data.filters.tag} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid gap-1">
          <h2 className="text-neutral-100 text-2xl font-semibold" id="articles-list-title">
            {data.filters.tag ? `Artigos em #${data.filters.tag}` : 'Todos os artigos'}
          </h2>
          <p className="text-neutral-500 text-sm">
            {data.pagination.total === 1
              ? '1 publicação encontrada'
              : `${data.pagination.total} publicações encontradas`}
          </p>
        </div>
      </div>

      {data.posts.length > 0 ? (
        <div>
          {data.posts.map((post, index) => (
            <ArticleCard key={post.id} post={post} priority={index === 0} />
          ))}
        </div>
      ) : (
        <EmptyArticles data={data} />
      )}

      <ArticlesPagination
        currentPage={data.pagination.page}
        selectedTag={data.filters.tag}
        sort={data.filters.sort}
        totalPages={data.pagination.totalPages}
      />
    </section>
  );
}

export function ArticlesPageStream({ filters }: Readonly<ArticlesPageStreamProps>) {
  const client = createWebCachedPublicApiClient();
  const tagsPromise = getArticlesTags(client);
  const listPromise = getArticlesListData({ client, filters });

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-10 px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
      <ArticlesHeader />
      <Suspense fallback={<TagsSkeleton />}>
        <TagsSection filters={filters} tagsPromise={tagsPromise} />
      </Suspense>
      <Suspense fallback={<ArticlesListSkeleton />}>
        <ArticlesListSection listPromise={listPromise} />
      </Suspense>
    </div>
  );
}
