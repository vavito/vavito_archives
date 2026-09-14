'use client';

import { useEffect, useState } from 'react';

import { normalizePostSearchQuery } from '../services/search-published-posts';
import { searchPostsFromBrowser } from '../services/search-posts-from-browser';

const POST_SEARCH_DEBOUNCE_MS = 300;

interface SearchState {
  data: Awaited<ReturnType<typeof searchPostsFromBrowser>> | undefined;
  error: unknown;
  query: string;
}

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delay);

    return () => window.clearTimeout(timeout);
  }, [delay, value]);

  return debouncedValue;
}

export function usePostSearch(query: string) {
  const normalizedQuery = normalizePostSearchQuery(query);
  const debouncedQuery = useDebouncedValue(normalizedQuery, POST_SEARCH_DEBOUNCE_MS);
  const [search, setSearch] = useState<SearchState>({
    data: undefined,
    error: null,
    query: '',
  });

  useEffect(() => {
    if (!debouncedQuery) {
      return;
    }

    const controller = new AbortController();
    let active = true;

    void searchPostsFromBrowser({ query: debouncedQuery, signal: controller.signal })
      .then((data) => {
        if (!active) return;
        setSearch({ data, error: null, query: debouncedQuery });
      })
      .catch((error: unknown) => {
        if (!active || controller.signal.aborted) return;
        setSearch({ data: undefined, error, query: debouncedQuery });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [debouncedQuery]);

  const hasCurrentResult = Boolean(debouncedQuery) && search.query === debouncedQuery;

  return {
    data: hasCurrentResult ? search.data : undefined,
    debouncedQuery,
    error: hasCurrentResult ? search.error : null,
    isDebouncing: normalizedQuery !== debouncedQuery,
    isFetching: Boolean(debouncedQuery) && !hasCurrentResult,
    normalizedQuery,
  };
}
