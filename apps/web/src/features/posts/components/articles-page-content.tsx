import { chipVariants, cn } from '@vavito/ui';
import Link from 'next/link';

import type { ArticlesData } from '../types/posts.types';
import { ArticleCard } from './article-card';
import { ArticlesPagination } from './articles-pagination';
import { ArticlesSortSelect } from './articles-sort-select';

interface ArticlesPageContentProps {
  data: ArticlesData;
}

function EmptyArticles({ data }: Readonly<ArticlesPageContentProps>) {
  const isPageOutsideResult = data.filters.page > 1;
  const resetHref =
    isPageOutsideResult && data.filters.tag
      ? ({
          pathname: '/artigos',
          query: {
            tag: data.filters.tag,
            ...(data.filters.sort && data.filters.sort !== 'recent'
              ? { sort: data.filters.sort }
              : {}),
          },
        } as const)
      : ({
          pathname: '/artigos',
          query:
            data.filters.sort && data.filters.sort !== 'recent' ? { sort: data.filters.sort } : {},
        } as const);

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

export function ArticlesPageContent({ data }: Readonly<ArticlesPageContentProps>) {
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-10 px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
      <header className="grid max-w-prose gap-4">
        <p className="text-accent font-mono text-xs tracking-eyebrow uppercase">Arquivo completo</p>
        <h1 className="text-neutral-100 text-[2.125rem] leading-[1.08] font-semibold tracking-[-0.035em] sm:text-4xl">
          Artigos
        </h1>
        <p className="text-neutral-400 text-base leading-relaxed">
          Notas sobre desenvolvimento de software, arquitetura, produto e os aprendizados por trás
          de cada projeto.
        </p>
      </header>

      <section aria-labelledby="articles-filter-title" className="grid gap-4">
        <h2 className="text-neutral-100 text-sm font-semibold" id="articles-filter-title">
          Filtrar por tópico
        </h2>
        <nav aria-label="Filtros da listagem de artigos" className="flex flex-wrap gap-2">
          <Link
            aria-current={!data.filters.tag ? 'page' : undefined}
            className={cn(chipVariants({ active: !data.filters.tag }))}
            href={{
              pathname: '/artigos',
              query:
                data.filters.sort && data.filters.sort !== 'recent'
                  ? { sort: data.filters.sort }
                  : {},
            }}
          >
            Todos
          </Link>
          {data.tags.map((tag) => (
            <Link
              key={tag.id}
              aria-current={data.filters.tag === tag.slug ? 'page' : undefined}
              aria-label={
                tag.publishedPostCount === undefined
                  ? tag.name
                  : `${tag.name}, ${tag.publishedPostCount} artigos`
              }
              className={cn(chipVariants({ active: data.filters.tag === tag.slug }))}
              href={{
                pathname: '/artigos',
                query: {
                  tag: tag.slug,
                  ...(data.filters.sort && data.filters.sort !== 'recent'
                    ? { sort: data.filters.sort }
                    : {}),
                },
              }}
            >
              {tag.name}
              {tag.publishedPostCount !== undefined ? (
                <span className="text-[10px] opacity-70">{tag.publishedPostCount}</span>
              ) : null}
            </Link>
          ))}
        </nav>
      </section>

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
            {data.posts.map((post) => (
              <ArticleCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <EmptyArticles data={data} />
        )}
      </section>

      <ArticlesPagination
        currentPage={data.pagination.page}
        selectedTag={data.filters.tag}
        sort={data.filters.sort}
        totalPages={data.pagination.totalPages}
      />
    </div>
  );
}
