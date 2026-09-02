import type { Metadata } from 'next';

import { ContentPage } from '@web/components/layout/content-page';
import { NewsletterSubscriptionResult } from '@web/features/newsletter/components/newsletter-subscription-result';

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: 'Cancelar newsletter',
};

export default function UnsubscribeNewsletterPage() {
  return (
    <ContentPage
      description="Estamos processando sua solicitação com segurança."
      eyebrow="Newsletter"
      title="Cancelamento da inscrição"
    >
      <NewsletterSubscriptionResult action="unsubscribe" />
    </ContentPage>
  );
}
