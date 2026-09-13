'use client';

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Input,
} from '@vavito/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState, useTransition } from 'react';
import {
  ActionFeedback,
  type ActionFeedbackMessage,
} from '@web/components/feedback/action-feedback';
import { LoadingSpinner } from '@web/components/feedback/loading-spinner';
import {
  editCampaignAction,
  deleteCampaignAction,
  refreshCampaignAction,
  sendCampaignAction,
} from '../actions/admin-campaign.actions';
import { campaignStatusLabels, type AdminCampaign } from '../types/admin-community.types';

export function AdminCampaignDetail({
  campaign,
  attemptKey,
}: Readonly<{ campaign: AdminCampaign; attemptKey: string }>) {
  const [override, setOverride] = useState<{ base: string; data: AdminCampaign } | null>(null);
  const current = override?.base === campaign.updatedAt ? override.data : campaign;
  const [fields, setFields] = useState<{
    base: string;
    subject: string;
    previewText: string;
  } | null>(null);
  const subject = fields?.base === current.updatedAt ? fields.subject : current.subject;
  const previewText = fields?.base === current.updatedAt ? fields.previewText : current.previewText;
  const [confirming, setConfirming] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const router = useRouter();
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [feedback, setFeedback] = useState<ActionFeedbackMessage | null>(null);
  const [pending, startTransition] = useTransition();
  const busy = useRef(false);
  const key = useRef(attemptKey);
  const dismiss = useCallback(() => setFeedback(null), []);
  const dirty = subject !== current.subject || previewText !== current.previewText;
  const editable = current.status === 'DRAFT' && !pending && !needsRefresh;

  function execute(action: 'save' | 'send' | 'refresh' | 'delete') {
    if (busy.current) return;
    busy.current = true;
    startTransition(async () => {
      try {
        if (action === 'delete') {
          const deletion = await deleteCampaignAction(current.id);
          if (deletion.ok) {
            router.push('/admin/campaigns');
            router.refresh();
            return;
          }
          setFeedback({ id: Date.now(), message: deletion.message, tone: 'error' });
          return;
        }
        const result =
          action === 'send'
            ? await sendCampaignAction(current.id, key.current)
            : action === 'save'
              ? await editCampaignAction(current.id, { subject, previewText })
              : await refreshCampaignAction(current.id);
        if (result.ok) {
          setOverride({ base: campaign.updatedAt, data: result.data });
          if (typeof result.data.idempotencyKey === 'string')
            key.current = result.data.idempotencyKey;
          setNeedsRefresh(false);
          if (action === 'save') setFields(null);
        } else if (action === 'send') {
          setNeedsRefresh(true);
        }
        setFeedback({
          id: Date.now(),
          message: result.message,
          tone: result.ok ? 'success' : 'error',
        });
      } catch {
        if (action === 'send') setNeedsRefresh(true);
        setFeedback({
          id: Date.now(),
          message: 'Não conseguimos confirmar o resultado. Atualize o estado para conferir.',
          tone: 'error',
        });
      } finally {
        busy.current = false;
        setConfirming(false);
        setConfirmingDelete(false);
      }
    });
  }

  return (
    <main className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-8 sm:px-6">
      <Link href="/admin/campaigns" className="text-sm text-accent hover:underline">
        Voltar às campanhas
      </Link>
      <header>
        <p className="text-sm text-accent" role="status">
          {campaignStatusLabels[current.status]}
        </p>
        <h1 className="mt-2 text-3xl font-semibold [overflow-wrap:anywhere]">Revisar campanha</h1>
        <p className="mt-2 text-neutral-400 [overflow-wrap:anywhere]">
          {current.postSnapshots.map(({ title }) => title).join(' · ')}
        </p>
      </header>
      <div className="grid gap-4 rounded-2xl border border-border bg-surface-card p-5">
        <Input
          label="Assunto do email"
          maxLength={255}
          required
          disabled={!editable}
          value={subject}
          onChange={(event) =>
            setFields({ base: current.updatedAt, subject: event.target.value, previewText })
          }
        />
        <Input
          label="Texto de prévia"
          maxLength={255}
          disabled={!editable}
          value={previewText}
          onChange={(event) =>
            setFields({ base: current.updatedAt, subject, previewText: event.target.value })
          }
        />
        <div className="flex flex-wrap gap-3">
          {current.status === 'DRAFT' ? (
            <>
              <Button
                disabled={!editable || !dirty || !subject.trim()}
                variant="secondary"
                onClick={() => execute('save')}
              >
                Salvar alterações
              </Button>
              <Button disabled={!editable || dirty} onClick={() => setConfirming(true)}>
                Enviar campanha
              </Button>
            </>
          ) : null}
          <Button disabled={pending} variant="ghost" onClick={() => execute('refresh')}>
            Atualizar estado
          </Button>
          {current.status === 'DRAFT' || current.status === 'FAILED' ? (
            <Button disabled={pending} variant="danger" onClick={() => setConfirmingDelete(true)}>
              Excluir campanha
            </Button>
          ) : null}
          {pending ? (
            <p role="status" className="flex items-center gap-2 text-sm text-neutral-400">
              <LoadingSpinner /> Processando…
            </p>
          ) : null}
        </div>
        {dirty ? (
          <p className="text-sm text-neutral-400">
            Salve as alterações antes de enviar. O preview abaixo mostra a versão salva.
          </p>
        ) : null}
        {needsRefresh ? (
          <p role="alert" className="text-sm text-neutral-300">
            O resultado do envio ainda precisa ser confirmado. Use Atualizar estado antes de
            continuar.
          </p>
        ) : null}
        {current.status === 'SENDING' ? (
          <p className="text-sm text-neutral-400">
            Enviando para {current.audienceCount} assinantes. Atualize o estado para acompanhar.
          </p>
        ) : null}
        {current.status === 'SENT' ? (
          <p className="text-sm text-neutral-400">
            Envio aceito para {current.audienceCount} destinatários. A chegada à caixa de entrada
            pode levar alguns instantes.
          </p>
        ) : null}
        {current.status === 'FAILED' ? (
          <p className="text-sm text-neutral-400">
            O envio não foi concluído. Alguns emails podem ter sido aceitos; esta campanha não
            permite reenvio automático.
          </p>
        ) : null}
      </div>
      <section aria-label="Preview do email" className="grid gap-3">
        <h2 className="text-xl font-semibold">Preview do email</h2>
        <p className="text-sm text-neutral-400">
          O link de cancelamento será personalizado para cada assinante.
        </p>
        <iframe
          title="Preview da campanha"
          sandbox=""
          referrerPolicy="no-referrer"
          className="h-[600px] w-full rounded-2xl border border-border bg-white"
          srcDoc={`<!doctype html><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src http: https: data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">${current.htmlSnapshot}`}
        />
      </section>
      <Dialog
        open={confirming}
        onOpenChange={(open) => {
          if (!pending) setConfirming(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar esta campanha?</DialogTitle>
            <DialogDescription>
              O email será enviado aos assinantes confirmados. Este envio é único e não pode ser
              desfeito.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-neutral-300 [overflow-wrap:anywhere]">
            Assunto: {current.subject}
          </p>
          <DialogFooter>
            <Button variant="secondary" disabled={pending} onClick={() => setConfirming(false)}>
              Cancelar
            </Button>
            <Button disabled={pending} onClick={() => execute('send')}>
              {pending ? <LoadingSpinner /> : null}
              {pending ? 'Enviando…' : 'Confirmar envio'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={confirmingDelete}
        onOpenChange={(open) => !pending && setConfirmingDelete(open)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir esta campanha?</DialogTitle>
            <DialogDescription>
              Esta ação remove definitivamente este rascunho e não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              disabled={pending}
              onClick={() => setConfirmingDelete(false)}
              variant="secondary"
            >
              Cancelar
            </Button>
            <Button disabled={pending} onClick={() => execute('delete')} variant="danger">
              {pending ? <LoadingSpinner /> : null}Excluir campanha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {feedback ? (
        <ActionFeedback key={feedback.id} feedback={feedback} onDismiss={dismiss} />
      ) : null}
    </main>
  );
}
