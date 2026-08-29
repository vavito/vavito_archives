import { notFound } from 'next/navigation';

import { DesignSystemDemo } from '@web/components/design-system-demo';

export default function DesignSystemPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return <DesignSystemDemo />;
}
