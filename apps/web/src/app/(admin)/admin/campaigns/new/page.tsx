import { Input } from '@vavito/ui';
import Link from 'next/link';
import type { Route } from 'next';
import { PageError } from '@web/components/feedback/page-error';
import { AdminCampaignForm } from '@web/features/admin/components/admin-campaign-form';
import { AdminCommunityPagination } from '@web/features/admin/components/admin-community-pagination';
import {
  adminPageNumber,
  isAdminResourceId,
} from '@web/features/admin/schemas/admin-community.schema';
import {
  getAdminPostDetail,
  listAdminPosts,
} from '@web/features/admin/services/admin-posts-query.service';
import { requireAdminSession } from '@web/features/admin/services/admin-session.service';
import { createWebAuthenticatedApiClient } from '@web/lib/api/api-client';

export default async function NewCampaignPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ postId?: string; q?: string; page?: string }> }>) {
  const [params, session] = await Promise.all([searchParams, requireAdminSession()]);
  const client = createWebAuthenticatedApiClient(() => session.accessToken);
  let post;
  let data;
  const query = typeof params.q === 'string' ? params.q.slice(0, 200) : '';
  try {
    if (isAdminResourceId(params.postId)) {
      post = await getAdminPostDetail(params.postId, client);
    } else {
      data = await listAdminPosts(
        { page: adminPageNumber(params.page), query, status: 'PUBLISHED' },
        client,
      );
    }
  } catch {
    return (
      <PageError
        title="Não foi possível preparar a campanha."
        description="Confira se o artigo está disponível e tente novamente."
      />
    );
  }
  const content = post ? (
    post.status === 'PUBLISHED' ? (
      <AdminCampaignForm postId={post.id} title={post.title} />
    ) : (
      <p>Publique o artigo antes de criar a campanha.</p>
    )
  ) : data ? (
    <section className="grid gap-5">
      <h2 className="text-xl font-semibold">Escolha um artigo publicado</h2>
      <form action="/admin/campaigns/new" method="get" className="flex gap-3">
        <Input
          aria-label="Buscar artigo publicado"
          name="q"
          maxLength={200}
          defaultValue={query}
          placeholder="Buscar artigo"
        />
        <button className="text-accent" type="submit">
          Buscar
        </button>
      </form>
      {data.items.length ? (
        <ul className="grid gap-3">
          {data.items.map((post) => (
            <li key={post.id}>
              <Link
                className="block rounded-xl border border-border p-4 transition-colors hover:border-accent [overflow-wrap:anywhere]"
                href={`/admin/campaigns/new?postId=${post.id}` as Route}
              >
                {post.title}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-neutral-400">Nenhum artigo publicado encontrado.</p>
      )}
      <AdminCommunityPagination
        basePath="/admin/campaigns/new"
        page={data.meta.page}
        totalPages={data.meta.totalPages}
        filters={query ? { q: query } : {}}
      />
    </section>
  ) : null;
  return (
    <main className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-8 sm:px-6">
      <Link href="/admin/campaigns" className="text-sm text-accent hover:underline">
        Voltar às campanhas
      </Link>
      <h1 className="text-3xl font-semibold">Nova campanha</h1>
      {content}
    </main>
  );
}
