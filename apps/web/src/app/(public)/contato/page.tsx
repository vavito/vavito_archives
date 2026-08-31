import type { Metadata } from 'next';

import { ContactPageContent } from '@web/features/contact';

export const metadata: Metadata = {
  description: 'Envie uma mensagem para o autor do Vavito Archives.',
  title: 'Contato — Vavito Archives',
};

export default function ContactPage() {
  return <ContactPageContent />;
}
