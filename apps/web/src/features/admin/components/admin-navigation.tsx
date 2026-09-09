'use client';

import { chipVariants, cn } from '@vavito/ui';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function AdminNavigation() {
  const pathname = usePathname();
  return (
    <header className="mx-auto grid w-full max-w-6xl gap-3 px-4 pt-6 sm:px-6">
      <Link
        className="text-neutral-400 hover:text-neutral-100 inline-flex w-fit items-center gap-2 text-sm transition-colors"
        href="/"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Voltar ao site
      </Link>
      <p className="text-accent font-mono text-xs tracking-eyebrow uppercase">Administração</p>
      <nav aria-label="Áreas da administração" className="flex flex-wrap gap-2 py-1">
        {(
          [
            ['/admin/posts', 'Artigos'],
            ['/admin/comments', 'Comentários'],
            ['/admin/campaigns', 'Newsletter'],
          ] as const
        ).map(([href, label]) => (
          <Link
            aria-current={pathname.startsWith(href) ? 'page' : undefined}
            className={cn(chipVariants({ active: pathname.startsWith(href) }))}
            href={href}
            key={href}
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
