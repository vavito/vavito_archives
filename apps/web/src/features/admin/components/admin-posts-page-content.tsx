import { buttonVariants, chipVariants, cn, Input } from '@vavito/ui';
import { Eye, FilePenLine, Plus, Search } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';

import type { AdminPostStatus, AdminPostsPage } from '../types/admin-post.types';
import { AdminPostActions } from './admin-post-actions';
import { AdminPostsPagination } from './admin-posts-pagination';

const statusOptions: readonly { label: string; value: AdminPostStatus | null }[] = [
  { label: 'Todos', value: null },
  { label: 'Rascunhos', value: 'DRAFT' },
  { label: 'Publicados', value: 'PUBLISHED' },
  { label: 'Arquivados', value: 'ARCHIVED' },
];

const statusLabels: Readonly<Record<AdminPostStatus, string>> = {
  ARCHIVED: 'Arquivado',
  DRAFT: 'Rascunho',
  PUBLISHED: 'Publicado',
};

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function filterUrl(data: AdminPostsPage, status: AdminPostStatus | null): Route {
  const query = new URLSearchParams();
  if (data.filters.query) query.set('q', data.filters.query);
  if (status) query.set('status', status);
  const serialized = query.toString();
  return serialized ? `/admin/posts?${serialized}` : '/admin/posts';
}

export function AdminPostsPageContent({ data }: Readonly<{ data: AdminPostsPage }>) {
  return (
    <main className="mx-auto grid min-h-screen w-full max-w-6xl content-start gap-10 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <header className="grid gap-6 sm:flex sm:items-end sm:justify-between">
        <div>
          <h1 className="text-neutral-100 mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Artigos
          </h1>
          <p className="text-neutral-400 mt-2 text-sm">
            Encontre rascunhos, versões publicadas e conteúdos arquivados.
          </p>
        </div>
        <Link
          className={cn('h-fit shrink-0 self-start', buttonVariants({ variant: 'primary' }))}
          href="/admin?new=1"
        >
          <Plus aria-hidden="true" />
          Novo artigo
        </Link>
      </header>

      <section aria-labelledby="admin-post-filters" className="grid gap-5">
        <h2 className="sr-only" id="admin-post-filters">
          Filtrar artigos
        </h2>
        <form
          action="/admin/posts"
          className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center"
          method="get"
        >
          {data.filters.status ? (
            <input name="status" type="hidden" value={data.filters.status} />
          ) : null}
          <div className="min-w-0 flex-1">
            <Input
              aria-label="Buscar por título ou slug"
              defaultValue={data.filters.query}
              maxLength={200}
              name="q"
              placeholder="Buscar por título ou slug"
              type="search"
            />
          </div>
          <button
            className={cn(
              'h-fit shrink-0 self-start sm:self-center',
              buttonVariants({ variant: 'secondary' }),
            )}
            type="submit"
          >
            <Search aria-hidden="true" />
            Buscar
          </button>
        </form>
        <nav aria-label="Filtrar por status" className="flex flex-wrap items-center gap-2">
          {statusOptions.map((option) => (
            <Link
              aria-current={data.filters.status === option.value ? 'page' : undefined}
              className={cn(
                'h-fit shrink-0 self-center',
                chipVariants({ active: data.filters.status === option.value }),
              )}
              href={filterUrl(data, option.value)}
              key={option.label}
            >
              {option.label}
            </Link>
          ))}
        </nav>
      </section>

      <section aria-labelledby="admin-post-list" className="grid gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-neutral-100 text-xl font-semibold" id="admin-post-list">
              Conteúdo editorial
            </h2>
            <p className="text-neutral-400 mt-1 text-sm">
              {data.meta.total === 1
                ? '1 artigo encontrado'
                : `${data.meta.total} artigos encontrados`}
            </p>
          </div>
        </div>

        {data.items.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-border bg-surface-card">
            <ul className="divide-y divide-divider">
              {data.items.map((post) => (
                <li
                  className="grid gap-4 p-5 transition-colors duration-300 hover:bg-surface-raised sm:grid-cols-[1fr_auto] sm:items-center"
                  key={post.id}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          'rounded-full border px-2.5 py-1 text-[11px] font-medium',
                          post.status === 'PUBLISHED' && 'border-[#4ade80]/40 text-[#86efac]',
                          post.status === 'DRAFT' && 'border-accent/40 text-accent',
                          post.status === 'ARCHIVED' && 'border-border text-neutral-400',
                        )}
                      >
                        {statusLabels[post.status]}
                      </span>
                      <time
                        className="text-neutral-500 font-mono text-[11px]"
                        dateTime={post.updatedAt}
                      >
                        Atualizado em {dateFormatter.format(new Date(post.updatedAt))}
                      </time>
                    </div>
                    <h3 className="text-neutral-100 mt-3 truncate text-lg font-semibold">
                      {post.title.trim() || 'Artigo sem título'}
                    </h3>
                    <p className="text-neutral-500 mt-1 truncate font-mono text-xs">
                      {post.slug ? `/${post.slug}` : 'Endereço ainda não definido'}
                    </p>
                    <p className="text-neutral-500 mt-2 text-xs">Por {post.author.displayName}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      className={cn(buttonVariants({ size: 'small', variant: 'secondary' }))}
                      href={`/admin?post=${post.id}` as Route}
                    >
                      <FilePenLine aria-hidden="true" />
                      Abrir
                    </Link>
                    <Link
                      className={cn(buttonVariants({ size: 'small', variant: 'ghost' }))}
                      href={`/admin/posts/${post.id}/preview` as Route}
                    >
                      <Eye aria-hidden="true" />
                      Preview
                    </Link>
                    <AdminPostActions
                      allowDelete
                      initialStatus={post.status}
                      postId={post.id}
                      slug={post.slug}
                      title={post.title}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="grid justify-items-center gap-3 rounded-2xl border border-dashed border-border px-6 py-14 text-center">
            <p className="text-neutral-100 text-lg font-semibold">Nenhum artigo encontrado</p>
            <p className="text-neutral-400 max-w-md text-sm">
              Ajuste a busca ou escolha outro status para continuar.
            </p>
            <Link className="text-accent text-sm font-medium hover:underline" href="/admin/posts">
              Limpar filtros
            </Link>
          </div>
        )}
      </section>

      <AdminPostsPagination data={data} />
    </main>
  );
}
