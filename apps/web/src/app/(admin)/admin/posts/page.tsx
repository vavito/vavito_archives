import type { Metadata } from 'next';

import { PageError } from '@web/components/feedback/page-error';
import { AdminNavigation } from '@web/features/admin/components/admin-navigation';
import { AdminPostsPageContent, listAdminPosts, type AdminPostStatus } from '@web/features/admin';
import { requireAdminSession } from '@web/features/admin/services/admin-session.service';
import { createWebAuthenticatedApiClient } from '@web/lib/api/api-client';

export const metadata: Metadata = {
  title: 'Artigos | Administração',
};

interface AdminPostsPageProps {
  searchParams: Promise<{
    page?: string | string[];
    q?: string | string[];
    status?: string | string[];
  }>;
}

function firstParameter(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parsePage(value: string | undefined): number {
  if (!value || !/^\d+$/.test(value)) return 1;
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

function parseStatus(value: string | undefined): AdminPostStatus | null {
  return value === 'ARCHIVED' || value === 'DRAFT' || value === 'PUBLISHED' ? value : null;
}

export default async function AdminPostsPage({ searchParams }: Readonly<AdminPostsPageProps>) {
  const [parameters, session] = await Promise.all([searchParams, requireAdminSession()]);
  let data: Awaited<ReturnType<typeof listAdminPosts>>;

  try {
    data = await listAdminPosts(
      {
        page: parsePage(firstParameter(parameters.page)),
        query: firstParameter(parameters.q) ?? '',
        status: parseStatus(firstParameter(parameters.status)),
      },
      createWebAuthenticatedApiClient(() => session.accessToken),
    );
  } catch {
    return (
      <>
        <AdminNavigation />
        <PageError
          description="Não conseguimos buscar seus artigos agora. Tente novamente em alguns instantes."
          title="Não foi possível carregar a administração."
        />
      </>
    );
  }

  return (
    <>
      <AdminNavigation />
      <AdminPostsPageContent data={data} />
    </>
  );
}
