import type { Metadata } from 'next';

import { PrivacyPageContent } from '@web/features/institutional';

export const metadata: Metadata = {
  description: 'Entenda como o Vavito Archives trata dados de conta, participação e comunicação.',
  title: 'Privacidade — Vavito Archives',
};

export default function PrivacyPage() {
  return <PrivacyPageContent />;
}
