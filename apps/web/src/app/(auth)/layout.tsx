import type { Metadata } from 'next';
import { SiteShell } from '@web/components/layout/site-shell';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: 'Acessar conta',
};

export default function AuthLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <SiteShell contentClassName="auth-page-stage items-center justify-center px-4 py-12 sm:px-6">
      {children}
    </SiteShell>
  );
}
