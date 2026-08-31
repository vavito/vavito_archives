import { PrivacyPageContent } from '@web/features/institutional';
import { createPublicPageMetadata } from '@web/lib/seo/metadata';

export const metadata = createPublicPageMetadata({
  description: 'Entenda como o Vavito Archives trata dados de conta, participação e comunicação.',
  pathname: '/privacidade',
  title: 'Privacidade',
});

export default function PrivacyPage() {
  return <PrivacyPageContent />;
}
