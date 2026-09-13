import Image from 'next/image';

interface SiteBrandProps {
  priority?: boolean;
  size?: 'default' | 'small';
}

export function SiteBrand({ priority = false, size = 'default' }: SiteBrandProps) {
  const isSmall = size === 'small';

  return (
    <span className="flex items-center gap-2.5" data-testid="site-brand">
      <Image
        alt=""
        aria-hidden="true"
        className={`${isSmall ? 'h-5' : 'h-6'} w-auto transition-transform duration-300 group-hover:scale-105`}
        height={591}
        priority={priority}
        src="/brand/vavito-symbol.webp"
        width={1017}
      />
      <span
        className={`${isSmall ? 'text-sm' : 'text-sm sm:text-base'} whitespace-nowrap tracking-tight`}
      >
        <strong className="font-semibold">vavito</strong>{' '}
        <span className="font-normal">archives</span>
      </span>
    </span>
  );
}
