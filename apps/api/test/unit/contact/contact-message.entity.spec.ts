import { ContactMessage } from '@api/modules/contact/domain/entities/contact-message.entity';
import { ContactMessageStatus } from '@api/modules/contact/domain/enums/contact-message-status.enum';
import { ContactMessageContentInvalidError } from '@api/modules/contact/domain/errors/contact-message-content-invalid.error';
import { InvalidContactMessageStatusTransitionError } from '@api/modules/contact/domain/errors/invalid-contact-message-status-transition.error';

const ID = '49d6cdaa-a5f5-4716-9b27-39006338557b';
const CREATED_AT = new Date('2026-08-26T10:00:00.000Z');

function create(): ContactMessage {
  return ContactMessage.create({
    email: '  Leitor@Example.COM ',
    id: ID,
    message: '  Gostaria de sugerir uma nova pauta.  ',
    name: '  João   Victor  ',
    now: CREATED_AT,
  });
}

describe('ContactMessage', () => {
  it('normaliza os dados e inicia como RECEIVED', () => {
    const contactMessage = create();

    expect(contactMessage).toMatchObject({
      email: 'leitor@example.com',
      id: ID,
      message: 'Gostaria de sugerir uma nova pauta.',
      name: 'João Victor',
      status: ContactMessageStatus.RECEIVED,
      subject: 'Contato pelo site',
    });
    expect(contactMessage.readAt).toBeNull();
    expect(contactMessage.archivedAt).toBeNull();
  });

  it.each([
    { email: 'email-invalido' },
    { message: 'curta' },
    { name: 'A' },
    { subject: 'assunto\u0000inválido' },
  ])('rejeita conteúdo inválido', (override) => {
    expect(() =>
      ContactMessage.create({
        email: 'leitor@example.com',
        id: ID,
        message: 'Mensagem válida para contato.',
        name: 'Leitor',
        now: CREATED_AT,
        subject: 'Sugestão',
        ...override,
      }),
    ).toThrow(ContactMessageContentInvalidError);
  });

  it('percorre RECEIVED, READ e ARCHIVED com datas auditáveis', () => {
    const contactMessage = create();
    const readAt = new Date('2026-08-26T11:00:00.000Z');
    const archivedAt = new Date('2026-08-26T12:00:00.000Z');

    contactMessage.markRead(readAt);
    expect(contactMessage.status).toBe(ContactMessageStatus.READ);
    expect(contactMessage.readAt).toEqual(readAt);

    contactMessage.archive(archivedAt);
    expect(contactMessage.status).toBe(ContactMessageStatus.ARCHIVED);
    expect(contactMessage.archivedAt).toEqual(archivedAt);
    expect(contactMessage.updatedAt).toEqual(archivedAt);
  });

  it('impede arquivamento antes da leitura', () => {
    expect(() => create().archive(new Date('2026-08-26T11:00:00.000Z'))).toThrow(
      InvalidContactMessageStatusTransitionError,
    );
  });
});
