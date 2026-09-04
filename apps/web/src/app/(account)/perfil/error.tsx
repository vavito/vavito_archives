'use client';

import { PageError, type RouteErrorProps } from '@web/components/feedback/page-error';

export default function ProfileError({ retry }: Readonly<RouteErrorProps>) {
  return (
    <PageError
      description="Não conseguimos buscar os dados da sua conta agora. Tente novamente em alguns instantes."
      retry={retry}
      title="Não foi possível carregar seu perfil."
    />
  );
}
