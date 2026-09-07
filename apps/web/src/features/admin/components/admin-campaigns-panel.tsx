import { buttonVariants, chipVariants, cn } from '@vavito/ui';
import Link from 'next/link';
import type { Route } from 'next';
import {
  campaignStatusLabels,
  type AdminCampaign,
  type AdminCampaignsPage,
} from '../types/admin-community.types';
import { AdminCommunityPagination } from './admin-community-pagination';

export function AdminCampaignsPanel({
  data,
  status,
}: Readonly<{ data: AdminCampaignsPage; status?: AdminCampaign['status'] }>) {
  return (
    <main className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Newsletter</h1>
          <p className="mt-2 text-neutral-400">Prepare uma nova leitura para seus assinantes.</p>
        </div>
        <Link className={cn(buttonVariants())} href="/admin/campaigns/new">
          Nova campanha
        </Link>
      </header>
      <nav aria-label="Filtrar campanhas" className="flex flex-wrap gap-2">
        <Link className={cn(chipVariants({ active: !status }))} href="/admin/campaigns">
          Todas
        </Link>
        {Object.entries(campaignStatusLabels).map(([value, label]) => (
          <Link
            aria-current={status === value ? 'page' : undefined}
            className={cn(chipVariants({ active: status === value }))}
            href={`/admin/campaigns?status=${value}` as Route}
            key={value}
          >
            {label}
          </Link>
        ))}
      </nav>
      {data.items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-neutral-400">
          Nenhuma campanha neste filtro.
        </p>
      ) : (
        <ul className="grid gap-4">
          {data.items.map((campaign) => (
            <li
              className="flex min-w-0 flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface-card p-5"
              key={campaign.id}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm text-accent">{campaignStatusLabels[campaign.status]}</p>
                <h2 className="mt-2 text-lg font-semibold [overflow-wrap:anywhere]">
                  {campaign.subject}
                </h2>
                <p className="mt-1 text-sm text-neutral-400 [overflow-wrap:anywhere]">
                  {campaign.postSnapshot.title}
                </p>
                <p className="mt-2 text-xs text-neutral-500">
                  {campaign.status === 'DRAFT'
                    ? 'Público definido ao iniciar o envio'
                    : `${campaign.audienceCount} destinatários`}
                </p>
              </div>
              <Link
                className={cn(buttonVariants({ variant: 'secondary', size: 'small' }))}
                href={`/admin/campaigns/${campaign.id}` as Route}
              >
                Abrir preview
              </Link>
            </li>
          ))}
        </ul>
      )}
      <AdminCommunityPagination
        basePath="/admin/campaigns"
        page={data.meta.page}
        totalPages={data.meta.totalPages}
        filters={status ? { status } : {}}
      />
    </main>
  );
}
