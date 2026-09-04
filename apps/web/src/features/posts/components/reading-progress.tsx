'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

const subscribeToDocument = () => () => {};
const getDocument = () => document.body;
const getServerDocument = () => null;

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);
  const container = useSyncExternalStore(subscribeToDocument, getDocument, getServerDocument);

  useEffect(() => {
    function updateProgress() {
      const content = document.getElementById('article-reading-content');
      if (!content) return;
      const bounds = content.getBoundingClientRect();
      // Start and finish when the respective content edge reaches the screen center.
      const readingLine = window.innerHeight / 2;
      const start = Math.max(0, bounds.top + window.scrollY - readingLine);
      const end = Math.max(start + 1, bounds.bottom + window.scrollY - readingLine);
      const nextProgress = ((window.scrollY - start) / (end - start)) * 100;

      setProgress(Math.min(100, Math.max(0, Math.round(nextProgress))));
    }

    updateProgress();
    window.addEventListener('resize', updateProgress, { passive: true });
    window.addEventListener('scroll', updateProgress, { passive: true });
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateProgress);
    observer?.observe(document.body);

    return () => {
      window.removeEventListener('resize', updateProgress);
      window.removeEventListener('scroll', updateProgress);
      observer?.disconnect();
    };
  }, []);

  if (!container) return null;
  return createPortal(
    <div
      aria-label="Progresso de leitura"
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={progress}
      className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-1 bg-divider"
      role="progressbar"
    >
      <div
        className="bg-accent h-full origin-left transition-transform duration-100 motion-reduce:transition-none"
        style={{ transform: `scaleX(${progress / 100})` }}
      />
    </div>,
    container,
  );
}
