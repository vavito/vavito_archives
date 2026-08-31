import type { Metadata } from 'next';

import { AboutPageContent } from '@web/features/institutional';

export const metadata: Metadata = {
  description: 'Conheça o autor e o propósito editorial do Vavito Archives.',
  title: 'Sobre — Vavito Archives',
};

export default function AboutPage() {
  return <AboutPageContent />;
}
