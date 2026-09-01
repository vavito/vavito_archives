import { AboutPageContent } from '@web/features/institutional';
import { createPublicPageMetadata } from '@web/lib/seo/metadata';

export const metadata = createPublicPageMetadata({
  description: 'Conheça o autor e o propósito editorial do Vavito Archives.',
  pathname: '/sobre',
  title: 'Sobre',
});

export default function AboutPage() {
  return <AboutPageContent />;
}
