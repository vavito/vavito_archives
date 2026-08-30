'use client';

import { useEffect } from 'react';

import { trackPostView } from '../services/track-post-view';

export function PostViewTracker({ slug }: Readonly<{ slug: string }>) {
  useEffect(() => {
    void trackPostView({ slug }).catch(() => {
      // A visualização é best effort e não deve interromper a leitura.
    });
  }, [slug]);

  return null;
}
