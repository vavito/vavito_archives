import { chipVariants, cn } from '@vavito/ui';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { NewsletterSignup } from '@web/features/newsletter/components/newsletter-signup';
import { ArticleCard } from '@web/features/posts/components/article-card';

import type { HomeData } from '../types/home.types';

interface HomePageContentProps {
  data: HomeData;
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

export function HomePageContent({ data }: Readonly<HomePageContentProps>) {
  const mostReadPost = data.popularPosts[0];

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-16 px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
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

        <dl className="grid grid-cols-2 gap-4 border-y border-divider py-5 sm:grid-cols-3">
          <div className="grid gap-1">
            <dt className="text-neutral-500 text-xs">Artigos publicados</dt>
            <dd className="text-neutral-100 font-mono text-xl">{data.publishedPostsCount}</dd>
          </div>
          <div className="grid gap-1">
            <dt className="text-neutral-500 text-xs">Tópicos ativos</dt>
            <dd className="text-neutral-100 font-mono text-xl">{data.tags.length}</dd>
          </div>
          <div className="col-span-2 grid gap-1 sm:col-span-1">
            <dt className="text-neutral-500 text-xs">Leituras do destaque</dt>
            <dd className="text-neutral-100 font-mono text-xl">
              {mostReadPost?.viewCount.toLocaleString('pt-BR') ?? '0'}
            </dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="topics-title" className="grid gap-5">
        <div className="grid gap-2">
          <h2 className="text-neutral-100 text-base font-semibold" id="topics-title">
            Filtrar por tópico
          </h2>
          <nav aria-label="Filtros de artigos" className="flex flex-wrap gap-2">
            <Link className={cn(chipVariants({ active: !data.selectedTag }))} href="/">
              Todos
            </Link>
            {data.tags.map((tag) => (
              <Link
                key={tag.id}
                aria-current={data.selectedTag === tag.slug ? 'page' : undefined}
                aria-label={
                  tag.publishedPostCount === undefined
                    ? tag.name
                    : `${tag.name}, ${tag.publishedPostCount} artigos`
                }
                className={cn(chipVariants({ active: data.selectedTag === tag.slug }))}
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

      <section aria-labelledby="recent-posts-title" className="grid gap-7">
        <SectionHeader
          description={
            data.selectedTag
              ? `Publicações mais recentes em #${data.selectedTag}.`
              : 'As últimas anotações adicionadas ao arquivo.'
          }
          id="recent-posts-title"
          title="Últimos artigos"
        />
        {data.recentPosts.length > 0 ? (
          <div>
            {data.recentPosts.map((post) => (
              <ArticleCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <EmptyPosts selectedTag={data.selectedTag} />
        )}
      </section>

      <section aria-labelledby="popular-posts-title" className="grid gap-7">
        <SectionHeader
          description="Os textos mais acessados pelos leitores."
          id="popular-posts-title"
          title="Mais acessados"
        />
        {data.popularPosts.length > 0 ? (
          <div className="bg-surface-card rounded-2xl border border-border px-5 py-1 sm:px-6">
            {data.popularPosts.map((post) => (
              <ArticleCard compact key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <EmptyPosts selectedTag={data.selectedTag} />
        )}
      </section>

      <NewsletterSignup />
    </div>
  );
}
