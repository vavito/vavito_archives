'use client';

import { chipVariants, cn } from '@vavito/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function AdminNavigation() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Áreas da administração"
      className="mx-auto flex w-full max-w-6xl flex-wrap gap-2 px-4 py-4 sm:px-6"
    >
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
  );
}
