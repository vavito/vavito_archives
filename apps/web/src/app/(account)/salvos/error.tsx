'use client';

import { PageError, type RouteErrorProps } from '@web/components/feedback/page-error';

export default function SavedError({ retry }: Readonly<RouteErrorProps>) {
  return (
    <PageError
      title="Não foi possível carregar seus artigos salvos."
      description="Não conseguimos abrir sua biblioteca agora. Tente novamente em alguns instantes."
      retry={retry}
    />
  );
}
