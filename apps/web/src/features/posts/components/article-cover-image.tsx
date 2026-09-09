'use client';

import { cn } from '@vavito/ui';
import { useState } from 'react';

interface ArticleCoverImageProps {
  alt: string | null;
  className?: string;
  positionX?: number;
  positionY?: number;
  priority?: boolean;
  scale?: number;
  src: string;
  title: string;
  variant?: 'card' | 'hero' | 'preview' | 'thumbnail';
}

export function ArticleCoverImage({
  alt,
  className,
  positionX = 50,
  positionY = 50,
  priority = false,
  scale = 100,
  src,
  title,
  variant = 'card',
}: Readonly<ArticleCoverImageProps>) {
  const [loaded, setLoaded] = useState(false);

  return (
    <figure
      className={cn(
        'relative overflow-hidden',
        variant === 'hero' ? 'bg-transparent' : 'bg-surface-card',
        variant === 'hero' && 'rounded-2xl',
        className,
      )}
    >
      {!loaded ? (
        <span
          aria-label="Carregando capa"
          className="absolute inset-0 animate-pulse bg-gradient-to-b from-surface-card via-surface-raised to-surface-card"
          role="status"
        />
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element -- A URL pública é dinâmica e resolvida pela API a partir do Storage. */}
      <img
        alt={alt ?? title}
        className={cn(
          'motion-media w-full object-cover transition-opacity duration-300',
          variant === 'thumbnail'
            ? 'h-[120px] sm:h-20'
            : variant === 'preview'
              ? 'h-[180px] sm:aspect-[16/9] sm:h-auto'
              : variant === 'hero'
                ? 'h-[16rem] sm:aspect-[16/9] sm:h-auto'
                : 'aspect-[16/9] h-auto',
          variant === 'hero' && 'rounded-2xl border border-border',
          loaded ? 'opacity-100' : 'opacity-0',
        )}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        loading={priority ? 'eager' : 'lazy'}
        onError={() => setLoaded(true)}
        onLoad={() => setLoaded(true)}
        src={src}
        style={{
          objectPosition: `${positionX}% ${positionY}%`,
          transform: `scale(${scale / 100})`,
          transformOrigin: `${positionX}% ${positionY}%`,
        }}
      />
    </figure>
  );
}
