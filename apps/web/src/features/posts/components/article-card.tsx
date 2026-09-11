import { cn } from '@vavito/ui';
import { ArrowUpRight, Clock3, Eye } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';

import type { PostSummary } from '../types/posts.types';
import { ArticleCoverImage } from './article-cover-image';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  timeZone: 'UTC',
  year: 'numeric',
});

interface ArticleCardProps {
  compact?: boolean;
  post: PostSummary;
}

export function ArticleCard({ compact = false, post }: Readonly<ArticleCardProps>) {
  return (
    <article
      className={cn(
        'motion-card group min-w-0 rounded-xl border-b border-divider px-4 py-6 last:border-b-0',
        compact && 'py-5',
      )}
    >
      <Link
        aria-label={`Ler ${post.title}`}
        className="flex min-w-0 flex-col gap-5 [overflow-wrap:anywhere]"
        href={`/artigos/${post.slug}` as Route}
      >
        {post.coverUrl ? (
          <ArticleCoverImage
            alt={post.coverAlt}
            className="w-full shrink-0 rounded-xl border border-border"
            positionX={post.coverPositionX ?? 50}
            positionY={post.coverPositionY ?? 50}
            scale={post.coverScale ?? 100}
            src={post.coverUrl}
            title={post.title}
            variant="preview"
          />
        ) : null}

        <div className="grid min-w-0 flex-1 gap-3">
          <div className="grid gap-2">
            <div className="flex items-start justify-between gap-4">
              <h3
                className={cn(
                  'text-neutral-100 group-hover:text-accent text-lg leading-snug font-semibold transition-colors',
                  compact && 'text-base',
                )}
              >
                {post.title}
              </h3>
              <ArrowUpRight
                aria-hidden="true"
                className="text-neutral-600 group-hover:text-accent mt-1 size-4 shrink-0 transition-[color,transform] duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </div>
            <p className="text-neutral-400 line-clamp-2 text-sm leading-relaxed">{post.excerpt}</p>
          </div>

          <ul aria-label="Tags do artigo" className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <li className="text-accent font-mono text-[11px]" key={tag.id}>
                #{tag.slug}
              </li>
            ))}
          </ul>

          <div
            aria-label="Estatísticas do artigo"
            className="text-neutral-500 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px]"
          >
            <time dateTime={post.publishedAt}>
              {dateFormatter.format(new Date(post.publishedAt))}
            </time>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <Clock3 aria-hidden="true" className="size-3" />
              {post.readingTimeMinutes} min
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <Eye aria-hidden="true" className="size-3" />
              {post.viewCount.toLocaleString('pt-BR')}
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
