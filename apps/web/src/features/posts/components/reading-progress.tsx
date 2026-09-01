'use client';

import { useEffect, useState } from 'react';

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function updateProgress() {
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      const nextProgress = scrollableHeight <= 0 ? 100 : (window.scrollY / scrollableHeight) * 100;

      setProgress(Math.min(100, Math.max(0, Math.round(nextProgress))));
    }

    updateProgress();
    window.addEventListener('resize', updateProgress, { passive: true });
    window.addEventListener('scroll', updateProgress, { passive: true });

    return () => {
      window.removeEventListener('resize', updateProgress);
      window.removeEventListener('scroll', updateProgress);
    };
  }, []);

  return (
    <div
      aria-label="Progresso de leitura"
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={progress}
      className="fixed inset-x-0 top-0 z-50 h-0.5 bg-divider"
      role="progressbar"
    >
      <div
        className="bg-accent h-full origin-left transition-transform duration-100 motion-reduce:transition-none"
        style={{ transform: `scaleX(${progress / 100})` }}
      />
    </div>
  );
}
