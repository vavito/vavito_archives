import type { Metadata } from 'next';
import { requireAdminSession } from '@web/features/admin/services/admin-session.service';
import type { ReactNode } from 'react';
import { AdminNavigation } from '@web/features/admin/components/admin-navigation';

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: 'Administração',
};

export default async function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  await requireAdminSession();
  return (
    <>
      <AdminNavigation />
      {children}
    </>
  );
}
