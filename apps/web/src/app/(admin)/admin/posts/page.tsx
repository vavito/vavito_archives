import type { Metadata } from 'next';

import { PageError } from '@web/components/feedback/page-error';
import { AdminNavigation } from '@web/features/admin/components/admin-navigation';
import {
  AdminPostsPageContent,
  AdminTopicsManager,
  listAdminPosts,
  listAdminTags,
  type AdminPostStatus,
} from '@web/features/admin';
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
  let tags: Awaited<ReturnType<typeof listAdminTags>>;

  try {
    const client = createWebAuthenticatedApiClient(() => session.accessToken);
    const [posts, adminTags] = await Promise.all([
      listAdminPosts(
        {
          page: parsePage(firstParameter(parameters.page)),
          query: firstParameter(parameters.q) ?? '',
          status: parseStatus(firstParameter(parameters.status)),
        },
        client,
      ),
      listAdminTags(client),
    ]);
    data = posts;
    tags = adminTags;
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
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 pb-12 sm:px-6 lg:px-8">
        <AdminTopicsManager initialTags={tags} />
      </div>
    </>
  );
}
