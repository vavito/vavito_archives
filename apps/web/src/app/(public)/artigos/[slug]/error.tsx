'use client';

import { Button } from '@vavito/ui';
import { RotateCcw } from 'lucide-react';

interface ArticleErrorProps {
  error: Error & { digest?: string };
  retry: () => void;
}

export default function ArticleError({ error, retry }: Readonly<ArticleErrorProps>) {
  return (
    <div className="mx-auto grid min-h-[55vh] w-full max-w-reading place-items-center px-4 py-16 sm:px-6">
      <section aria-labelledby="article-error-title" className="grid max-w-md gap-4 text-center">
        <p className="text-accent font-mono text-xs tracking-eyebrow uppercase">Falha temporária</p>
        <h1 className="text-neutral-100 text-2xl font-semibold" id="article-error-title">
          Não foi possível carregar o artigo.
        </h1>
        <p className="text-neutral-400 text-sm leading-relaxed">
          A API não respondeu como esperado. Tente abrir o conteúdo novamente em instantes.
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
