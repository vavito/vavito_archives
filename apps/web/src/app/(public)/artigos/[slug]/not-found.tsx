import { buttonVariants, cn } from '@vavito/ui';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ArticleNotFound() {
  return (
    <div className="mx-auto grid min-h-[55vh] w-full max-w-reading place-items-center px-4 py-16 sm:px-6">
      <section
        aria-labelledby="article-not-found-title"
        className="grid max-w-md gap-4 text-center"
      >
        <p className="text-accent font-mono text-xs tracking-eyebrow uppercase">Erro 404</p>
        <h1 className="text-neutral-100 text-2xl font-semibold" id="article-not-found-title">
          Artigo não encontrado.
        </h1>
        <p className="text-neutral-400 text-sm leading-relaxed">
          O texto pode ter sido removido, arquivado ou ainda não está disponível para leitura.
        </p>
        <div>
          <Link className={cn(buttonVariants({ variant: 'secondary' }))} href="/artigos">
            <ArrowLeft aria-hidden="true" />
            Ver todos os artigos
          </Link>
        </div>
      </section>
    </div>
  );
}
