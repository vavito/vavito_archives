'use client';

import { PageError, type RouteErrorProps } from '@web/components/feedback/page-error';

export default function PublicError({ retry }: Readonly<RouteErrorProps>) {
  return <PageError retry={retry} />;
}
