import { Clock3, Eye } from 'lucide-react';
import Link from 'next/link';

import type { ArticlePageData } from '../types/posts.types';
import { ArticleCard } from './article-card';
import { ArticleShareButton } from './article-share-button';
import { PostViewTracker } from './post-view-tracker';
import { ReadingProgress } from './reading-progress';
import { TiptapContent } from './tiptap-content';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  timeZone: 'UTC',
  year: 'numeric',
});

export function ArticlePageContent({ data }: Readonly<{ data: ArticlePageData }>) {
  const { post, relatedPosts } = data;

  return (
    <article>
      <ReadingProgress />
      <PostViewTracker slug={post.slug} />

      <header className="mx-auto grid w-full max-w-3xl gap-6 px-4 pt-12 pb-10 sm:px-6 lg:px-8 lg:pt-20">
        <nav aria-label="Tópicos do artigo" className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Link
              className="text-accent font-mono text-xs hover:underline"
              href={{ pathname: '/artigos', query: { tag: tag.slug } }}
              key={tag.id}
            >
              #{tag.slug}
            </Link>
          ))}
        </nav>

        <div className="grid gap-4">
          <h1 className="text-neutral-100 text-3xl leading-tight font-semibold tracking-[-0.035em] sm:text-5xl">
            {post.title}
          </h1>
          <p className="text-neutral-400 max-w-prose text-base leading-relaxed sm:text-lg">
            {post.excerpt}
          </p>
        </div>

        <div className="text-neutral-500 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-xs">
          <time dateTime={post.publishedAt}>
            {dateFormatter.format(new Date(post.publishedAt))}
          </time>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1.5">
            <Clock3 aria-hidden="true" className="size-3.5" />
            {post.readingTimeMinutes} min de leitura
          </span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1.5">
            <Eye aria-hidden="true" className="size-3.5" />
            {post.viewCount.toLocaleString('pt-BR')} visualizações
          </span>
        </div>
      </header>

      {post.coverUrl ? (
        <figure className="mx-auto w-full max-w-cover px-4 sm:px-6 lg:px-8">
          {/* eslint-disable-next-line @next/next/no-img-element -- A URL pública é resolvida pela API a partir do Storage. */}
          <img
            alt={post.coverAlt ?? ''}
            className="motion-media aspect-[16/9] h-auto w-full rounded-2xl border border-border object-cover"
            decoding="async"
            fetchPriority="high"
            src={post.coverUrl}
          />
        </figure>
      ) : null}

      <div className="mx-auto grid w-full max-w-reading gap-10 px-4 py-12 sm:px-6 lg:px-0 lg:py-16">
        <div className="article-prose">
          <TiptapContent content={post.content} />
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-divider pt-6">
          <p className="text-neutral-500 text-sm">Gostou do artigo? Compartilhe com alguém.</p>
          <ArticleShareButton title={post.title} />
        </footer>
      </div>

      {relatedPosts.length > 0 ? (
        <section
          aria-labelledby="related-posts-title"
          className="mx-auto grid w-full max-w-6xl gap-8 px-4 pt-8 pb-16 sm:px-6 lg:px-8 lg:pt-16 lg:pb-24"
        >
          <div className="grid gap-2">
            <h2 className="text-neutral-100 text-2xl font-semibold" id="related-posts-title">
              Artigos relacionados
            </h2>
            <p className="text-neutral-500 text-sm">Continue explorando o mesmo tópico.</p>
          </div>
          <div className="grid gap-x-8 md:grid-cols-3">
            {relatedPosts.map((relatedPost) => (
              <ArticleCard compact key={relatedPost.id} post={relatedPost} />
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
