import { buttonVariants, cn } from '@vavito/ui';
import { House } from 'lucide-react';
import Link from 'next/link';

interface NotFoundPageProps {
  description?: string;
  title?: string;
}

export function NotFoundPage({
  description = 'O endereço pode ter mudado ou o conteúdo não está mais disponível.',
  title = 'Página não encontrada.',
}: Readonly<NotFoundPageProps>) {
  return (
    <div className="mx-auto grid min-h-[55vh] w-full max-w-reading place-items-center px-4 py-16 sm:px-6">
      <section
        aria-labelledby="not-found-title"
        className="page-state-enter grid max-w-md gap-4 text-center"
      >
        <p className="text-accent font-mono text-xs tracking-eyebrow uppercase">Erro 404</p>
        <h1 className="text-neutral-100 text-2xl font-semibold" id="not-found-title">
          {title}
        </h1>
        <p className="text-neutral-400 text-sm leading-relaxed">{description}</p>
        <div>
          <Link className={cn(buttonVariants({ variant: 'secondary' }))} href="/">
            <House aria-hidden="true" />
            Ir para a página inicial
          </Link>
        </div>
      </section>
    </div>
  );
}
