import type { Metadata } from 'next';
import { requireAdminSession } from '@web/features/admin/services/admin-session.service';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: 'Administração',
};

export default async function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  await requireAdminSession();
  return children;
}
