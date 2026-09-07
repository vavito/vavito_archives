import { buttonVariants, cn } from '@vavito/ui';
import { House, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export function UnauthorizedPage() {
  return (
    <div className="mx-auto grid min-h-[55vh] w-full max-w-reading place-items-center px-4 py-16 sm:px-6">
      <section
        aria-labelledby="unauthorized-title"
        className="page-state-enter grid max-w-md justify-items-center gap-4 text-center"
      >
        <ShieldAlert aria-hidden="true" className="size-10 text-accent" />
        <p className="font-mono text-xs tracking-eyebrow text-accent uppercase">
          Acesso não autorizado
        </p>
        <h1 className="text-2xl font-semibold text-neutral-100" id="unauthorized-title">
          Você não tem permissão para acessar esta página.
        </h1>
        <p className="text-sm leading-relaxed text-neutral-400">
          Esta área está disponível somente para administradores do Vavito Archives.
        </p>
        <Link className={cn(buttonVariants({ variant: 'secondary' }))} href="/">
          <House aria-hidden="true" />
          Ir para a página inicial
        </Link>
      </section>
    </div>
  );
}
