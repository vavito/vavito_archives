import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { ContentPage } from '@web/components/layout/content-page';
import { ProfilePageContent } from '@web/features/profile';
import { getProfile } from '@web/features/profile/services/profile-api.service';
import { createWebAuthenticatedApiClient } from '@web/lib/api/api-client';
import { getAuthenticatedSession } from '@web/lib/auth/authenticated-session';

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: 'Perfil',
};

export default async function ProfilePage() {
  const session = await getAuthenticatedSession();

  if (!session) {
    redirect('/auth?next=/perfil');
  }

  const profile = await getProfile(createWebAuthenticatedApiClient(() => session.accessToken));

  return (
    <ContentPage
      description="Cuide de como você aparece nas conversas e mantenha sua conta protegida."
      eyebrow="Sua conta"
      title="Perfil"
    >
      <ProfilePageContent email={session.email} initialProfile={profile} />
    </ContentPage>
  );
}
