import { ApiClientError } from '@vavito/api-client';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PageError } from '@web/components/feedback/page-error';
import { AdminPostPreview, getAdminPostDetail } from '@web/features/admin';
import { requireAdminSession } from '@web/features/admin/services/admin-session.service';
import { createWebAuthenticatedApiClient } from '@web/lib/api/api-client';

export const metadata: Metadata = {
  title: 'Preview do artigo | Administração',
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(value);
}

export default async function AdminPostPreviewPage(
  props: Readonly<PageProps<'/admin/posts/[id]/preview'>>,
) {
  const [{ id }, session] = await Promise.all([props.params, requireAdminSession()]);

  if (!isUuid(id)) notFound();
  let post: Awaited<ReturnType<typeof getAdminPostDetail>>;

  try {
    post = await getAdminPostDetail(
      id,
      createWebAuthenticatedApiClient(() => session.accessToken),
    );
  } catch (error) {
    if (error instanceof ApiClientError && error.statusCode === 404) notFound();

    return (
      <PageError
        description="Não conseguimos preparar esta visualização agora. Tente novamente em alguns instantes."
        title="Não foi possível abrir o preview."
      />
    );
  }

  return <AdminPostPreview post={post} />;
}
