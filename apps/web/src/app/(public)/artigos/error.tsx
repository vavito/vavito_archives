'use client';

import { PageError, type RouteErrorProps } from '@web/components/feedback/page-error';

export default function ArticlesError({ retry }: Readonly<RouteErrorProps>) {
  return (
    <PageError
      description="Não conseguimos buscar os artigos agora. Tente novamente em alguns instantes."
      retry={retry}
      title="Não foi possível carregar os artigos."
    />
  );
}
