'use client';

import { cn } from '@vavito/ui';
import { Bookmark, Home, Newspaper, UserRound } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { lazy, Suspense, useState, type MouseEvent } from 'react';

import { LoadingSpinner } from '@web/components/feedback/loading-spinner';

const SavedAccessDialog = lazy(() => import('./saved-access-dialog'));

const navigationItems = [
  { href: '/', icon: Home, label: 'Início' },
  { href: '/artigos', icon: Newspaper, label: 'Artigos' },
  { href: '/salvos', icon: Bookmark, label: 'Salvos' },
  { href: '/perfil', icon: UserRound, label: 'Perfil' },
] as const;

export function MobileNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isCheckingSavedAccess, setIsCheckingSavedAccess] = useState(false);
  const [isSavedAccessOpen, setIsSavedAccessOpen] = useState(false);

  async function handleSavedNavigation(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();

    if (isCheckingSavedAccess) {
      return;
    }

    setIsCheckingSavedAccess(true);

    try {
      const { createBrowserSupabaseClient } = await import('@web/lib/auth/supabase/client');
      const supabase = createBrowserSupabaseClient();
      const { data, error } = await supabase.auth.getSession();

      if (!error && data.session) {
        router.push('/salvos');
        return;
      }

      setIsSavedAccessOpen(true);
    } catch {
      setIsSavedAccessOpen(true);
    } finally {
      setIsCheckingSavedAccess(false);
    }
  }

  return (
    <>
      <nav
        aria-label="Navegação móvel"
        className="mobile-nav-enter bg-overlay/95 fixed inset-x-0 bottom-0 z-50 border-t border-border px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden"
      >
        <ul className="mx-auto grid max-w-md grid-cols-4">
          {navigationItems.map(({ href, icon: Icon, label }) => {
            const isActive =
              href === '/'
                ? pathname === href
                : pathname === href || pathname.startsWith(`${href}/`);
            const isSavedItem = href === '/salvos';

            return (
              <li key={href}>
                <Link
                  aria-busy={isSavedItem && isCheckingSavedAccess ? true : undefined}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'group flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-[11px] transition-colors duration-300 active:scale-95',
                    isActive ? 'text-accent' : 'text-neutral-300 hover:text-neutral-100',
                  )}
                  href={href}
                  onClick={(event) => {
                    if (isSavedItem) {
                      void handleSavedNavigation(event);
                    }
                  }}
                >
                  {isSavedItem && isCheckingSavedAccess ? (
                    <LoadingSpinner className="size-[18px]" />
                  ) : (
                    <Icon
                      aria-hidden="true"
                      className="size-[18px] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110"
                    />
                  )}
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {isSavedAccessOpen ? (
        <Suspense fallback={null}>
          <SavedAccessDialog onOpenChange={setIsSavedAccessOpen} />
        </Suspense>
      ) : null}
    </>
  );
}
