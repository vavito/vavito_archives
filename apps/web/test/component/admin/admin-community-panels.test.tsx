import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminCommentsPanel } from '@web/features/admin/components/admin-comments-panel';
import { AdminCampaignDetail } from '@web/features/admin/components/admin-campaign-detail';
import { AdminCampaignsPanel } from '@web/features/admin/components/admin-campaigns-panel';
import { campaignFixture, commentsFixture } from '../../helpers/admin-community.fixtures';

const mocks = vi.hoisted(() => ({
  moderate: vi.fn(),
  edit: vi.fn(),
  send: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock('@web/features/admin/actions/admin-comment.actions', () => ({
  moderateCommentAction: mocks.moderate,
}));
vi.mock('@web/features/admin/actions/admin-campaign.actions', () => ({
  editCampaignAction: mocks.edit,
  sendCampaignAction: mocks.send,
  refreshCampaignAction: mocks.refresh,
}));

describe('moderação e campanhas no painel', () => {
  beforeEach(() => vi.resetAllMocks());

  it('exige confirmação e motivo opcional para ocultar um comentário', async () => {
    mocks.moderate.mockResolvedValue({ ok: true, data: {}, message: 'Moderação atualizada.' });
    render(<AdminCommentsPanel data={commentsFixture} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ocultar' }));
    expect(mocks.moderate).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole('textbox', { name: 'Motivo (opcional)' }), {
      target: { value: 'Fora do tema' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar moderação' }));
    await waitFor(() =>
      expect(mocks.moderate).toHaveBeenCalledWith('comment', 'HIDDEN', 'Fora do tema'),
    );
    expect(await screen.findByText('Moderação atualizada.')).toBeInTheDocument();
  });

  it('não oferece ações sobre comentários excluídos', () => {
    render(
      <AdminCommentsPanel
        data={{
          ...commentsFixture,
          items: commentsFixture.items.map((item) => ({
            ...item,
            status: 'DELETED',
            content: null,
            author: null,
          })),
        }}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Aprovar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ocultar' })).not.toBeInTheDocument();
    expect(screen.getByText('Conta excluída')).toBeInTheDocument();
  });

  it('isola o HTML do preview e impede envio com edição pendente', () => {
    render(<AdminCampaignDetail campaign={campaignFixture} attemptKey="attempt" />);
    const frame = screen.getByTitle('Preview da campanha');
    expect(frame).toHaveAttribute('sandbox', '');
    expect(frame.getAttribute('srcdoc')).toContain("default-src 'none'");
    fireEvent.change(screen.getByRole('textbox', { name: 'Assunto do email' }), {
      target: { value: 'Outro assunto' },
    });
    expect(screen.getByRole('button', { name: 'Enviar campanha' })).toBeDisabled();
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it('confirma um único envio mesmo com duplo clique e bloqueia reenvio depois do aceite', async () => {
    let finish!: (result: unknown) => void;
    mocks.send.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    render(<AdminCampaignDetail campaign={campaignFixture} attemptKey="attempt" />);
    fireEvent.click(screen.getByRole('button', { name: 'Enviar campanha' }));
    expect(mocks.send).not.toHaveBeenCalled();
    const confirm = screen.getByRole('button', { name: 'Confirmar envio' });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    expect(mocks.send).toHaveBeenCalledTimes(1);
    finish({
      ok: true,
      data: { ...campaignFixture, status: 'SENT', audienceCount: 2 },
      message: 'Envio aceito.',
    });
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Enviar campanha' })).not.toBeInTheDocument(),
    );
    expect(await screen.findByText('Envio aceito.')).toBeInTheDocument();
  });

  it('exige consultar o estado após resposta incerta e mantém a chave para repetir a tentativa', async () => {
    mocks.send.mockResolvedValue({ ok: false, message: 'Resultado incerto.' });
    mocks.refresh.mockResolvedValue({
      ok: true,
      data: campaignFixture,
      message: 'Estado atualizado.',
    });
    render(<AdminCampaignDetail campaign={campaignFixture} attemptKey="same-attempt" />);
    fireEvent.click(screen.getByRole('button', { name: 'Enviar campanha' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar envio' }));
    await screen.findByText('Resultado incerto.');
    expect(screen.getByRole('button', { name: 'Enviar campanha' })).toBeDisabled();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Atualizar estado' })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Atualizar estado' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Enviar campanha' })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Enviar campanha' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar envio' }));
    await waitFor(() => expect(mocks.send).toHaveBeenCalledTimes(2));
    expect(mocks.send).toHaveBeenNthCalledWith(2, campaignFixture.id, 'same-attempt');
  });

  it.each(['SENDING', 'SENT', 'FAILED'] as const)(
    'não permite edição ou novo envio no estado %s',
    (status) => {
      render(
        <AdminCampaignDetail campaign={{ ...campaignFixture, status }} attemptKey="attempt" />,
      );
      expect(screen.getByRole('textbox', { name: 'Assunto do email' })).toBeDisabled();
      expect(screen.queryByRole('button', { name: 'Enviar campanha' })).not.toBeInTheDocument();
    },
  );

  it('apresenta estado vazio e mantém filtros na paginação', () => {
    render(
      <AdminCampaignsPanel
        data={{ items: [], meta: { page: 2, limit: 20, total: 41, totalPages: 3 } }}
        status="FAILED"
      />,
    );
    expect(screen.getByText('Nenhuma campanha neste filtro.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Próxima' })).toHaveAttribute(
      'href',
      '/admin/campaigns?status=FAILED&page=3',
    );
  });
});
