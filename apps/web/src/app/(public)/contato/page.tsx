import { ContactPageContent } from '@web/features/contact';
import { createPublicPageMetadata } from '@web/lib/seo/metadata';

export const metadata = createPublicPageMetadata({
  description: 'Envie uma mensagem para o autor do Vavito Archives.',
  pathname: '/contato',
  title: 'Contato',
});

export default function ContactPage() {
  return <ContactPageContent />;
}
