import { SiteShell } from '@web/components/layout/site-shell';
import type { ReactNode } from 'react';

export default function PublicLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <SiteShell>{children}</SiteShell>;
}
