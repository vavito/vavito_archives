import { cn } from '@vavito/ui';

interface ArticleCoverImageProps {
  alt: string | null;
  className?: string;
  priority?: boolean;
  src: string;
  title: string;
  variant?: 'card' | 'hero' | 'thumbnail';
}

export function ArticleCoverImage({
  alt,
  className,
  priority = false,
  src,
  title,
  variant = 'card',
}: Readonly<ArticleCoverImageProps>) {
  return (
    <figure className={cn('overflow-hidden', variant === 'hero' && 'rounded-2xl', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- A URL pública é dinâmica e resolvida pela API a partir do Storage. */}
      <img
        alt={alt ?? title}
        className={cn(
          'motion-media w-full object-cover',
          variant === 'thumbnail' ? 'h-[120px] sm:h-20' : 'aspect-[16/9] h-auto',
          variant === 'hero' && 'rounded-2xl border border-border',
        )}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        loading={priority ? 'eager' : 'lazy'}
        src={src}
      />
    </figure>
  );
}
