'use client';

import { cn } from '@vavito/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigationItems = [
  { href: '/artigos', label: 'Artigos' },
  { href: '/sobre', label: 'Sobre' },
  { href: '/contato', label: 'Contato' },
] as const;

export function SiteNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegação principal" className="hidden items-center gap-7 md:flex">
      {navigationItems.map(({ href, label }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'text-sm transition-colors hover:text-neutral-100',
              isActive ? 'text-accent' : 'text-neutral-400',
            )}
            href={href}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
