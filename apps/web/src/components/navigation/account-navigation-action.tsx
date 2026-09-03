'use client';

import { Button, buttonVariants, cn } from '@vavito/ui';
import { Bookmark, ChevronDown, LogOut, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { LoadingSpinner } from '@web/components/feedback/loading-spinner';
import { ProfileAvatar } from '@web/features/profile';
import { createBrowserSupabaseClient } from '@web/lib/auth/supabase/client';

export interface AccountSummary {
  avatarUrl: string | null;
  displayName: string;
}

interface AccountNavigationActionProps {
  account: AccountSummary | null;
}

export function AccountNavigationFallback() {
  return (
    <span
      aria-label="Verificando sua sessão"
      className="bg-surface-raised hidden h-9 w-28 animate-pulse rounded-full sm:inline-flex"
      role="status"
    />
  );
}

export function AccountNavigationAction({ account }: Readonly<AccountNavigationActionProps>) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  async function handleSignOut() {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    setSignOutError(null);

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signOut({ scope: 'local' });

    if (error) {
      setSignOutError('Não foi possível sair agora. Tente novamente.');
      setIsSigningOut(false);
      return;
    }

    setIsOpen(false);
    router.replace('/');
    router.refresh();
  }

  if (!account) {
    return (
      <Link className={cn(buttonVariants({ size: 'small' }), 'hidden sm:inline-flex')} href="/auth">
        Entrar
      </Link>
    );
  }

  return (
    <div ref={containerRef} className="relative hidden sm:block">
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="group flex min-h-10 max-w-52 items-center gap-2 rounded-full px-1.5 py-1 text-sm text-neutral-200 transition-colors hover:text-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <ProfileAvatar
          avatarUrl={account.avatarUrl}
          displayName={account.displayName}
          size="small"
        />
        <span className="truncate">{account.displayName}</span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            'size-3.5 shrink-0 opacity-0 transition-[opacity,transform] duration-200 group-hover:opacity-100 group-focus-visible:opacity-100',
            isOpen && 'rotate-180 opacity-100',
          )}
        />
      </button>

      {isOpen ? (
        <div
          aria-label="Opções da conta"
          className="feedback-enter bg-floating absolute top-full right-0 mt-2 w-52 overflow-hidden rounded-xl border border-border p-1.5 shadow-2xl"
          role="menu"
        >
          <Link
            className="flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm text-neutral-300 transition-colors hover:bg-surface-raised hover:text-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            href="/perfil"
            onClick={() => setIsOpen(false)}
            role="menuitem"
          >
            <UserRound aria-hidden="true" className="size-4" />
            Minha Conta
          </Link>
          <Link
            className="flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm text-neutral-300 transition-colors hover:bg-surface-raised hover:text-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            href="/salvos"
            onClick={() => setIsOpen(false)}
            role="menuitem"
          >
            <Bookmark aria-hidden="true" className="size-4" />
            Artigos salvos
          </Link>
          <div className="my-1 border-t border-divider" />
          <Button
            className="min-h-10 w-full justify-start rounded-lg px-3 text-destructive hover:bg-destructive-hover hover:text-destructive"
            disabled={isSigningOut}
            onClick={() => void handleSignOut()}
            role="menuitem"
            variant="ghost"
          >
            {isSigningOut ? <LoadingSpinner /> : <LogOut aria-hidden="true" />}
            {isSigningOut ? 'Saindo…' : 'Fazer Logout'}
          </Button>
          {signOutError ? (
            <p className="px-3 py-2 text-xs leading-relaxed text-destructive" role="alert">
              {signOutError}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
