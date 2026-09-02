'use client';

import { cn } from '@vavito/ui';
import { Bookmark, Home, Newspaper, UserRound } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigationItems = [
  { href: '/', icon: Home, label: 'Início' },
  { href: '/artigos', icon: Newspaper, label: 'Artigos' },
  { href: '/salvos', icon: Bookmark, label: 'Salvos' },
  { href: '/perfil', icon: UserRound, label: 'Perfil' },
] as const;

export function MobileNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação móvel"
      className="mobile-nav-enter bg-overlay/95 fixed inset-x-0 bottom-0 z-50 border-t border-border px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {navigationItems.map(({ href, icon: Icon, label }) => {
          const isActive =
            href === '/' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

          return (
            <li key={href}>
              <Link
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'group flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-[11px] transition-colors duration-300 active:scale-95',
                  isActive ? 'text-accent' : 'text-neutral-500 hover:text-neutral-200',
                )}
                href={href as Route}
              >
                <Icon
                  aria-hidden="true"
                  className="size-[18px] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110"
                />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
