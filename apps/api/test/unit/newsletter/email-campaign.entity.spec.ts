import { EmailCampaign } from '@api/modules/newsletter/domain/entities/email-campaign.entity';
import { CampaignStatus } from '@api/modules/newsletter/domain/enums/campaign-status.enum';
import { CampaignAlreadySentError } from '@api/modules/newsletter/domain/errors/campaign-already-sent.error';
import { CampaignAudienceEmptyError } from '@api/modules/newsletter/domain/errors/campaign-audience-empty.error';
import { InvalidCampaignStatusTransitionError } from '@api/modules/newsletter/domain/errors/invalid-campaign-status-transition.error';

const CREATED_AT = new Date('2026-08-25T12:00:00.000Z');

function campaign(): EmailCampaign {
  return EmailCampaign.create({
    createdById: '501b31f5-9918-4614-a38e-fb307406be88',
    htmlSnapshot: '<html>{{unsubscribeUrl}}</html>',
    id: '0b68ee40-f392-49cb-95c4-dd19cdd1bd43',
    now: CREATED_AT,
    postId: 'bbd448e1-20bf-4fb3-aa26-f1ff9e7194f6',
    postSnapshot: {
      excerpt: 'Resumo',
      id: 'bbd448e1-20bf-4fb3-aa26-f1ff9e7194f6',
      publishedAt: '2026-08-24T12:00:00.000Z',
      readingTimeMinutes: 4,
      slug: 'artigo-publicado',
      title: 'Artigo publicado',
    },
    previewText: 'Nova leitura disponível',
    subject: 'Novo artigo',
  });
}

describe('EmailCampaign', () => {
  it('cria rascunho editável com snapshot isolado', () => {
    const draft = campaign();
    const snapshot = draft.postSnapshot;
    snapshot.title = 'Alterado fora da entidade';

    draft.updateContent({
      now: new Date('2026-08-25T12:05:00.000Z'),
      previewText: 'Preview atualizado',
      subject: 'Assunto atualizado',
    });

    expect(draft.status).toBe(CampaignStatus.DRAFT);
    expect(draft.subject).toBe('Assunto atualizado');
    expect(draft.postSnapshot.title).toBe('Artigo publicado');
  });

  it('congela audiência e chave antes de concluir o envio', () => {
    const value = campaign();
    value.startSending({
      audienceCount: 2,
      idempotencyKey: 'e1903668-2b3e-4df8-b945-eddb4ef53f90',
      now: new Date('2026-08-25T12:10:00.000Z'),
    });
    value.markSent('resend-message-id', new Date('2026-08-25T12:11:00.000Z'));

    expect(value.status).toBe(CampaignStatus.SENT);
    expect(value.audienceCount).toBe(2);
    expect(value.resendId).toBe('resend-message-id');
    expect(value.sentAt).toEqual(new Date('2026-08-25T12:11:00.000Z'));
  });

  it('rejeita audiência vazia, edição depois do início e novo envio após SENT', () => {
    const empty = campaign();
    expect(() =>
      empty.startSending({
        audienceCount: 0,
        idempotencyKey: 'e1903668-2b3e-4df8-b945-eddb4ef53f90',
        now: new Date('2026-08-25T12:10:00.000Z'),
      }),
    ).toThrow(CampaignAudienceEmptyError);

    const sent = campaign();
    sent.startSending({
      audienceCount: 1,
      idempotencyKey: 'e1903668-2b3e-4df8-b945-eddb4ef53f90',
      now: new Date('2026-08-25T12:10:00.000Z'),
    });
    expect(() =>
      sent.updateContent({ now: new Date('2026-08-25T12:11:00.000Z'), subject: 'Outro' }),
    ).toThrow(InvalidCampaignStatusTransitionError);
    sent.markSent('resend-id', new Date('2026-08-25T12:12:00.000Z'));
    expect(() =>
      sent.startSending({
        audienceCount: 1,
        idempotencyKey: 'f0be4392-3c56-41e6-b73a-a719593b30e9',
        now: new Date('2026-08-25T12:13:00.000Z'),
      }),
    ).toThrow(CampaignAlreadySentError);
  });

  it('registra falha sem perder o contexto idempotente', () => {
    const value = campaign();
    value.startSending({
      audienceCount: 1,
      idempotencyKey: 'e1903668-2b3e-4df8-b945-eddb4ef53f90',
      now: new Date('2026-08-25T12:10:00.000Z'),
    });
    value.markFailed('provider_rejected', new Date('2026-08-25T12:11:00.000Z'));

    expect(value.status).toBe(CampaignStatus.FAILED);
    expect(value.failureReason).toBe('provider_rejected');
    expect(value.idempotencyKey).toBe('e1903668-2b3e-4df8-b945-eddb4ef53f90');
  });
});
