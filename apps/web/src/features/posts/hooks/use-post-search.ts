'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { normalizePostSearchQuery, searchPublishedPosts } from '../services/search-published-posts';

const POST_SEARCH_DEBOUNCE_MS = 300;

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
  const search = useQuery({
    enabled: debouncedQuery.length > 0,
    queryFn: ({ signal }) => searchPublishedPosts({ query: debouncedQuery, signal }),
    queryKey: ['posts', 'search', debouncedQuery],
  });

  return {
    ...search,
    debouncedQuery,
    isDebouncing: normalizedQuery !== debouncedQuery,
    normalizedQuery,
  };
}
