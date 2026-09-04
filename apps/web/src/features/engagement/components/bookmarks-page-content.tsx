import { buttonVariants } from '@vavito/ui';
import { Bookmark } from 'lucide-react';
import Link from 'next/link';

import { ArticleCard } from '@web/features/posts';

import type { BookmarksPage } from '../types/bookmarks.types';
import { BookmarkButton } from './bookmark-button';
import { BookmarksPagination } from './bookmarks-pagination';

export function BookmarksPageContent({ data }: Readonly<{ data: BookmarksPage }>) {
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-10 px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
      <header className="grid gap-4">
        <p className="text-accent font-mono text-xs tracking-eyebrow uppercase">Sua biblioteca</p>
        <h1 className="text-neutral-100 text-4xl font-semibold tracking-[-0.035em]">
          Artigos salvos
        </h1>
        <p className="text-neutral-400 leading-relaxed">
          Seus próximos momentos de leitura, guardados em um só lugar. Só você pode ver esta lista.
        </p>
      </header>
      {data.items.length ? (
        <section aria-label="Artigos da sua biblioteca" className="grid gap-6">
          <p className="text-neutral-500 text-sm">
            {data.meta.total === 1 ? '1 artigo salvo' : `${data.meta.total} artigos salvos`}
          </p>
          {data.items.map((post) => (
            <div key={post.id} className="motion-card grid gap-4 border-b border-divider pb-6">
              <ArticleCard post={post} />
              <div>
                <BookmarkButton
                  key={`${post.id}-saved`}
                  initialBookmarked
                  isAuthenticated
                  inLibrary
                  postId={post.id}
                  slug={post.slug}
                />
              </div>
            </div>
          ))}
        </section>
      ) : (
        <section
          aria-labelledby="empty-bookmarks-title"
          className="page-state-enter grid justify-items-center gap-4 rounded-2xl border border-dashed border-border px-6 py-12 text-center"
        >
          <Bookmark aria-hidden="true" className="text-accent size-8" />
          <h2 id="empty-bookmarks-title" className="text-neutral-100 text-xl font-semibold">
            Você ainda não salvou nenhum artigo.
          </h2>
          <p className="text-neutral-400 max-w-md text-sm leading-relaxed">
            Ao encontrar algo interessante, toque em Salvar no artigo. Ele vai ficar aqui para você
            ler depois.
          </p>
          <Link className={buttonVariants({ variant: 'secondary' })} href="/artigos">
            Explorar artigos
          </Link>
        </section>
      )}
      <BookmarksPagination page={data.meta.page} totalPages={data.meta.totalPages} />
    </div>
  );
}
