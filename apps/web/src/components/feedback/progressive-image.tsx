'use client';

import { cn } from '@vavito/ui';
import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';

interface ProgressiveImageProps extends Omit<
  ImageProps,
  'className' | 'onError' | 'onLoad' | 'src'
> {
  className?: string;
  containerClassName?: string;
  loadingLabel?: string;
  onError?: ImageProps['onError'];
  onLoad?: ImageProps['onLoad'];
  src: string;
}

export function ProgressiveImage({
  className,
  containerClassName,
  loadingLabel = 'Carregando imagem',
  onError,
  onLoad,
  src,
  ...imageProps
}: Readonly<ProgressiveImageProps>) {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const hasFailed = failedSrc === src;
  const isLoading = loadedSrc !== src && !hasFailed;
  const shouldFade = !imageProps.preload;
  const fallbackText = imageProps.alt.trim() || 'Imagem indisponível';

  return (
    <span
      aria-busy={isLoading ? true : undefined}
      className={cn('relative block overflow-hidden', containerClassName)}
    >
      {isLoading ? (
        <span aria-label={loadingLabel} className="image-loading absolute inset-0" role="status" />
      ) : null}
      {hasFailed ? (
        <span
          aria-hidden="true"
          className="text-neutral-400 absolute inset-0 flex items-center justify-center px-4 text-center text-xs leading-relaxed"
        >
          {fallbackText}
        </span>
      ) : null}
      <Image
        {...imageProps}
        alt={imageProps.alt}
        className={cn(
          'text-transparent transition-opacity duration-300',
          hasFailed || (isLoading && shouldFade) ? 'opacity-0' : 'opacity-100',
          className,
        )}
        onError={(event) => {
          setFailedSrc(src);
          onError?.(event);
        }}
        onLoad={(event) => {
          setFailedSrc(null);
          setLoadedSrc(src);
          onLoad?.(event);
        }}
        src={src}
        unoptimized={imageProps.unoptimized ?? process.env.NODE_ENV === 'test'}
      />
    </span>
  );
}
