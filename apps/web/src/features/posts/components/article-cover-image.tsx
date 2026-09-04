import { cn } from '@vavito/ui';

interface ArticleCoverImageProps {
  alt: string | null;
  className?: string;
  priority?: boolean;
  src: string;
  title: string;
  variant?: 'card' | 'hero';
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
          'motion-media aspect-[16/9] h-auto w-full object-cover',
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
