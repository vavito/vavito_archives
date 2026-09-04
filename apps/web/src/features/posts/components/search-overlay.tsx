'use client';

import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@vavito/ui';
import { ArrowUpRight, Clock3, Search } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';

import { LoadingSpinner } from '@web/components/feedback/loading-spinner';

import { usePostSearch } from '../hooks/use-post-search';
import { POST_SEARCH_QUERY_MAX_LENGTH } from '../services/search-published-posts';
import type { PostSummary } from '../types/posts.types';

const EMPTY_RESULTS: PostSummary[] = [];

export function SearchOverlay() {
  const router = useRouter();
  const resultsId = useId();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const { data, error, isDebouncing, isFetching, normalizedQuery } = usePostSearch(query);
  const results = data ?? EMPTY_RESULTS;
  const resolvedActiveIndex =
    results.length === 0 ? -1 : Math.min(Math.max(activeIndex, 0), results.length - 1);

  useEffect(() => {
    const openSearch = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener('keydown', openSearch);
    return () => window.removeEventListener('keydown', openSearch);
  }, []);

  const closeSearch = () => {
    setOpen(false);
    setQuery('');
    setActiveIndex(-1);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setOpen(true);
      return;
    }

    closeSearch();
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((resolvedActiveIndex + 1) % results.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex(resolvedActiveIndex <= 0 ? results.length - 1 : resolvedActiveIndex - 1);
      return;
    }

    if (event.key === 'Enter' && resolvedActiveIndex >= 0) {
      event.preventDefault();
      const selectedPost = results[resolvedActiveIndex];

      if (selectedPost) {
        closeSearch();
        router.push(`/artigos/${selectedPost.slug}` as Route);
      }
    }
  };

  const isSearching = isDebouncing || isFetching;
  const activeResultId =
    resolvedActiveIndex >= 0 ? `${resultsId}-${resolvedActiveIndex}` : undefined;

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger asChild>
        <button
          aria-label="Buscar artigos"
          className="motion-control text-neutral-400 hover:bg-surface-raised hover:text-neutral-100 flex min-h-10 items-center gap-2 rounded-full border border-border px-3 text-sm md:min-w-44 md:justify-between"
          type="button"
        >
          <span className="flex items-center gap-2">
            <Search aria-hidden="true" className="size-4" />
            <span className="hidden md:inline">Buscar</span>
          </span>
          <kbd className="text-neutral-600 hidden font-mono text-[10px] md:inline">⌘/Ctrl K</kbd>
        </button>
      </DialogTrigger>

      <DialogContent className="bg-overlay max-w-md gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">Buscar artigos</DialogTitle>
        <DialogDescription className="sr-only">
          Pesquise artigos publicados por título, resumo ou tópico.
        </DialogDescription>

        <div className="relative rounded-t-2xl border-b border-divider">
          <Search
            aria-hidden="true"
            className="text-neutral-500 pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2"
          />
          <label className="sr-only" htmlFor="global-post-search">
            Buscar artigos
          </label>
          <input
            ref={searchInputRef}
            aria-activedescendant={activeResultId}
            aria-autocomplete="list"
            aria-controls={resultsId}
            aria-expanded={results.length > 0}
            autoComplete="off"
            autoFocus
            className="text-neutral-100 placeholder:text-neutral-600 min-h-16 w-full rounded-t-2xl bg-transparent py-4 pr-32 pl-11 text-base outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
            enterKeyHint="search"
            id="global-post-search"
            inputMode="search"
            maxLength={POST_SEARCH_QUERY_MAX_LENGTH}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(-1);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Busque por título, resumo ou tópico"
            role="combobox"
            type="text"
            value={query}
          />
          {query ? (
            <button
              className="text-neutral-500 hover:text-neutral-100 absolute top-1/2 right-14 inline-flex min-h-10 -translate-y-1/2 items-center rounded-md px-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              onClick={() => {
                setQuery('');
                setActiveIndex(-1);
                searchInputRef.current?.focus();
              }}
              type="button"
            >
              Limpar
            </button>
          ) : null}
        </div>

        <div
          aria-live="polite"
          className="max-h-[min(28rem,60vh)] overflow-x-hidden overflow-y-auto"
        >
          {!normalizedQuery ? (
            <p className="text-neutral-500 px-5 py-8 text-center text-sm">
              Digite para encontrar artigos publicados.
            </p>
          ) : null}

          {normalizedQuery && isSearching ? (
            <p
              className="feedback-enter text-neutral-500 flex items-center justify-center gap-2 px-5 py-8 text-center text-sm"
              role="status"
            >
              <LoadingSpinner />
              Buscando artigos…
            </p>
          ) : null}

          {normalizedQuery && !isSearching && error ? (
            <p className="text-neutral-400 px-5 py-8 text-center text-sm" role="alert">
              Não foi possível fazer a busca agora. Tente novamente em instantes.
            </p>
          ) : null}

          {normalizedQuery && !isSearching && !error && results.length === 0 ? (
            <p className="text-neutral-500 px-5 py-8 text-center text-sm">
              Nenhum artigo encontrado para “{normalizedQuery}”.
            </p>
          ) : null}

          {normalizedQuery && !isSearching && !error && results.length > 0 ? (
            <ul
              aria-label="Resultados da busca"
              className="divide-y divide-divider overflow-x-hidden"
              key={normalizedQuery}
              id={resultsId}
              role="listbox"
            >
              {results.map((post, index) => (
                <li
                  aria-selected={resolvedActiveIndex === index}
                  className="contents"
                  id={`${resultsId}-${index}`}
                  key={post.id}
                  role="option"
                >
                  <Link
                    className={`search-result-enter group grid min-w-0 gap-2 px-5 py-4 [overflow-wrap:anywhere] transition-colors duration-300 ${
                      resolvedActiveIndex === index
                        ? 'bg-surface-raised'
                        : 'hover:bg-surface-raised'
                    }`}
                    style={{ animationDelay: `${index * 45}ms` }}
                    href={`/artigos/${post.slug}` as Route}
                    onClick={closeSearch}
                    onMouseEnter={() => setActiveIndex(index)}
                    tabIndex={resolvedActiveIndex === index ? 0 : -1}
                  >
                    <span className="flex items-start justify-between gap-4">
                      <span className="text-neutral-100 group-hover:text-accent text-sm font-semibold transition-colors">
                        {post.title}
                      </span>
                      <ArrowUpRight
                        aria-hidden="true"
                        className="text-neutral-600 group-hover:text-accent mt-0.5 size-4 shrink-0"
                      />
                    </span>
                    <span className="text-neutral-500 line-clamp-2 text-xs leading-relaxed">
                      {post.excerpt}
                    </span>
                    <span className="text-neutral-600 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px]">
                      <span className="inline-flex items-center gap-1">
                        <Clock3 aria-hidden="true" className="size-3" />
                        {post.readingTimeMinutes} min
                      </span>
                      {post.tags.slice(0, 3).map((tag) => (
                        <span className="text-accent" key={tag.id}>
                          #{tag.slug}
                        </span>
                      ))}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="text-neutral-600 hidden items-center justify-between border-t border-divider px-5 py-3 font-mono text-[10px] sm:flex">
          <span>↑↓ navegar · Enter abrir</span>
          <span>Esc fechar</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
