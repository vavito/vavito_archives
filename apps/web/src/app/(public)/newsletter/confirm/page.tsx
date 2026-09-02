import type { Metadata } from 'next';

import { ContentPage } from '@web/components/layout/content-page';
import { NewsletterSubscriptionResult } from '@web/features/newsletter/components/newsletter-subscription-result';

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: 'Confirmar newsletter',
};

export default function ConfirmNewsletterPage() {
  return (
    <ContentPage
      description="Estamos validando o link enviado para o seu e-mail."
      eyebrow="Newsletter"
      title="Confirmação de inscrição"
    >
      <NewsletterSubscriptionResult action="confirm" />
    </ContentPage>
  );
}
