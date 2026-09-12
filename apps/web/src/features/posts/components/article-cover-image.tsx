import { cn } from '@vavito/ui';

import { ProgressiveImage } from '@web/components/feedback/progressive-image';

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
  const imageSize =
    variant === 'thumbnail'
      ? 'h-[120px] sm:h-20'
      : variant === 'preview'
        ? 'h-[180px] sm:aspect-[16/9] sm:h-auto'
        : variant === 'hero'
          ? 'h-[16rem] sm:aspect-[16/9] sm:h-auto'
          : 'aspect-[16/9]';
  const sizes =
    variant === 'hero'
      ? '(max-width: 640px) 100vw, 1024px'
      : variant === 'thumbnail'
        ? '(max-width: 640px) 100vw, 192px'
        : '(max-width: 768px) 100vw, 50vw';

  return (
    <figure
      className={cn(
        'relative overflow-hidden',
        variant === 'hero' ? 'bg-transparent' : 'bg-surface-card',
        variant === 'hero' && 'rounded-2xl',
        className,
      )}
    >
      <ProgressiveImage
        alt={alt ?? title}
        className="motion-media size-full object-cover"
        containerClassName={cn(
          'w-full',
          imageSize,
          variant === 'hero' && 'rounded-2xl border border-border',
        )}
        fill
        loadingLabel={`Carregando capa de ${title}`}
        preload={priority}
        quality={80}
        sizes={sizes}
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
