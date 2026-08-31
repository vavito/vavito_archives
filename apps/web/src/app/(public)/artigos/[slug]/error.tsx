'use client';

import { PageError, type RouteErrorProps } from '@web/components/feedback/page-error';

export default function ArticleError({ retry }: Readonly<RouteErrorProps>) {
  return (
    <PageError
      description="Não conseguimos abrir este artigo agora. Tente novamente em alguns instantes."
      retry={retry}
      title="Não foi possível carregar o artigo."
    />
  );
}
