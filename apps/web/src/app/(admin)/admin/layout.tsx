import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { RouteMotion } from '@web/components/feedback/route-motion';
import { requireAdminSession } from '@web/features/admin/services/admin-session.service';

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: 'Administração',
};

export default async function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  await requireAdminSession();
  return <RouteMotion>{children}</RouteMotion>;
}
