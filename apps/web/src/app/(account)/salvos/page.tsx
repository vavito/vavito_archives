import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { PageError } from '@web/components/feedback/page-error';
import { BookmarksPageContent, getBookmarksPage } from '@web/features/engagement';
import { createWebAuthenticatedApiClient } from '@web/lib/api/api-client';
import { withPageDataTimeout } from '@web/lib/api/page-data-timeout';
import { getAuthenticatedSession } from '@web/lib/auth/authenticated-session';

export const metadata: Metadata = {
  title: 'Artigos salvos',
  robots: { index: false, follow: false },
};

interface SavedPageProps {
  searchParams: Promise<{ page?: string | string[] }>;
}

export default async function SavedPage({ searchParams }: Readonly<SavedPageProps>) {
  const session = await getAuthenticatedSession();
  if (!session) redirect('/auth?next=/salvos');

  const parameters = await searchParams;
  const parameter = Array.isArray(parameters.page) ? parameters.page[0] : parameters.page;
  const parsed = parameter && /^\d+$/.test(parameter) ? Number(parameter) : 1;
  const page = Number.isSafeInteger(parsed) && parsed > 0 && parsed <= 2147483647 ? parsed : 1;
  let data: Awaited<ReturnType<typeof getBookmarksPage>>;
  try {
    data = await withPageDataTimeout(() =>
      getBookmarksPage(
        page,
        createWebAuthenticatedApiClient(() => session.accessToken),
      ),
    );
  } catch {
    return (
      <PageError
        title="Não foi possível carregar seus artigos salvos."
        description="Não conseguimos abrir sua biblioteca agora. Tente novamente em alguns instantes."
      />
    );
  }

  // Após remover o último item de uma página, retorna à última página disponível.
  const lastPage = Math.max(1, data.meta.totalPages);
  if (page > lastPage) redirect(lastPage === 1 ? '/salvos' : `/salvos?page=${lastPage}`);
  return <BookmarksPageContent data={data} />;
}
