'use client';

import { Button } from '@vavito/ui';
import { RotateCcw } from 'lucide-react';

interface ArticlesErrorProps {
  error: Error & { digest?: string };
  retry: () => void;
}

export default function ArticlesError({ error, retry }: Readonly<ArticlesErrorProps>) {
  return (
    <div className="mx-auto grid min-h-[55vh] w-full max-w-3xl place-items-center px-4 py-16 sm:px-6">
      <section aria-labelledby="articles-error-title" className="grid max-w-md gap-4 text-center">
        <p className="text-accent font-mono text-xs tracking-eyebrow uppercase">Falha temporária</p>
        <h1 className="text-neutral-100 text-2xl font-semibold" id="articles-error-title">
          Não foi possível carregar a listagem.
        </h1>
        <p className="text-neutral-400 text-sm leading-relaxed">
          A API não respondeu como esperado. Tente carregar os artigos novamente em instantes.
        </p>
        <div>
          <Button onClick={retry}>
            <RotateCcw aria-hidden="true" />
            Tentar novamente
          </Button>
        </div>
        {error.digest ? (
          <p className="text-neutral-600 font-mono text-[10px]">Referência: {error.digest}</p>
        ) : null}
      </section>
    </div>
  );
}
