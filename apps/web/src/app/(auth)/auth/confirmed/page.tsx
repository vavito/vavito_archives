import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { EmailConfirmed } from '@web/features/auth';
import { subscribeConfirmedAccount } from '@web/features/newsletter/services/subscribe-confirmed-account';
import { getAuthenticatedSession } from '@web/lib/auth/authenticated-session';

export const metadata: Metadata = {
  description: 'Confirmação de cadastro concluída no Vavito Archives.',
  robots: { follow: false, index: false },
  title: 'E-mail confirmado',
};

export default async function EmailConfirmedPage() {
  const session = await getAuthenticatedSession();

  if (!session) {
    redirect('/auth?auth_error=confirmation_failed');
  }

  await subscribeConfirmedAccount(session.accessToken).catch(() => undefined);

  return <EmailConfirmed />;
}
