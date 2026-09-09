import type { Metadata } from 'next';

import { UnauthorizedPage } from '@web/components/feedback/unauthorized-page';

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: 'Acesso não autorizado',
};

export default function Unauthorized() {
  return <UnauthorizedPage />;
}
