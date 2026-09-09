import { buttonVariants, cn } from '@vavito/ui';
import { ArrowLeft, Clock3, Eye, FilePenLine, LockKeyhole } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';

import { TiptapContent } from '@web/features/posts';

import type { AdminPostDetail, AdminPostStatus } from '../types/admin-post.types';
import { AdminPostActions } from './admin-post-actions';

const statusLabels: Readonly<Record<AdminPostStatus, string>> = {
  ARCHIVED: 'Arquivado',
  DRAFT: 'Rascunho',
  PUBLISHED: 'Publicado',
};

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'long',
  timeZone: 'UTC',
});

export function AdminPostPreview({ post }: Readonly<{ post: AdminPostDetail }>) {
  return (
    <main className="min-h-screen">
      <div className="bg-accent-soft text-accent border-b border-accent/20 px-4 py-3 text-center text-xs">
        <span className="inline-flex items-center gap-2">
          <LockKeyhole aria-hidden="true" className="size-3.5" />
          Preview protegido — somente administradores visualizam esta versão.
        </span>
      </div>
      <nav className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-5 sm:px-6">
        <Link
          className="text-neutral-400 hover:text-neutral-100 inline-flex items-center gap-2 text-sm transition-colors"
          href="/admin/posts"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Todos os artigos
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Link
            className={cn(buttonVariants({ size: 'small', variant: 'secondary' }))}
            href={`/admin?post=${post.id}` as Route}
          >
            <FilePenLine aria-hidden="true" />
            Editar
          </Link>
          <AdminPostActions initialStatus={post.status} postId={post.id} title={post.title} />
        </div>
      </nav>

      <article className="pb-20">
        <header className="mx-auto grid w-full max-w-3xl gap-5 px-4 pt-8 pb-8 sm:px-6 lg:pt-14">
          <div className="flex flex-wrap items-center gap-2">
            <span className="border-accent/30 text-accent rounded-full border px-2.5 py-1 text-xs">
              {statusLabels[post.status]}
            </span>
            {post.tags.map((tag) => (
              <span className="text-accent font-mono text-xs" key={tag.id}>
                #{tag.slug}
              </span>
            ))}
          </div>
          <div className="grid gap-4">
            <h1 className="text-neutral-100 text-3xl leading-tight font-semibold tracking-[-0.035em] sm:text-5xl">
              {post.title.trim() || 'Artigo sem título'}
            </h1>
            <p className="text-neutral-400 text-base leading-relaxed sm:text-lg">
              {post.excerpt ?? 'O resumo ainda não foi preenchido.'}
            </p>
          </div>
          <p className="text-neutral-300 text-sm">Por {post.author.displayName}</p>
          <div className="text-neutral-500 flex flex-wrap items-center gap-3 font-mono text-xs">
            <time dateTime={post.publishedAt ?? post.updatedAt}>
              {dateFormatter.format(new Date(post.publishedAt ?? post.updatedAt))}
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
          <figure className="mx-auto w-full max-w-5xl overflow-hidden px-4 pb-8 sm:px-6">
            {/* eslint-disable-next-line @next/next/no-img-element -- a URL editorial validada pode vir de Storage configurado em runtime. */}
            <img
              alt={post.coverAlt ?? ''}
              className="max-h-[34rem] w-full rounded-2xl object-cover"
              src={post.coverUrl}
              style={{
                objectPosition: `${post.coverPositionX ?? 50}% ${post.coverPositionY ?? 50}%`,
                transform: `scale(${(post.coverScale ?? 100) / 100})`,
                transformOrigin: `${post.coverPositionX ?? 50}% ${post.coverPositionY ?? 50}%`,
              }}
            />
          </figure>
        ) : null}

        <div className="article-prose mx-auto min-w-0 w-full max-w-reading px-4 sm:px-6 lg:px-0">
          <TiptapContent content={post.content} />
        </div>
      </article>
    </main>
  );
}
