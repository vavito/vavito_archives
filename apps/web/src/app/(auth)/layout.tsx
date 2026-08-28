import { SiteShell } from '@web/components/layout/site-shell';
import type { ReactNode } from 'react';

export default function AuthLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <SiteShell contentClassName="items-center justify-center px-4 py-12 sm:px-6">
      {children}
    </SiteShell>
  );
}
