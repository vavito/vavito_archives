import { ContactMessageStatus as PrismaContactMessageStatus } from '@api/generated/prisma/client';
import { ContactMessage } from '@api/modules/contact/domain/entities/contact-message.entity';
import { ContactMessageStatus } from '@api/modules/contact/domain/enums/contact-message-status.enum';
import { ContactMessageMapper } from '@api/modules/contact/mappers/contact-message.mapper';

const ID = '49d6cdaa-a5f5-4716-9b27-39006338557b';
const CREATED_AT = new Date('2026-08-26T10:00:00.000Z');

describe('ContactMessageMapper', () => {
  it('converte uma mensagem nova para persistência Prisma', () => {
    const contactMessage = ContactMessage.create({
      email: 'leitor@example.com',
      id: ID,
      message: 'Mensagem válida para contato.',
      name: 'Leitor',
      now: CREATED_AT,
      subject: 'Sugestão',
    });

    expect(ContactMessageMapper.toPersistence(contactMessage)).toEqual({
      archivedAt: null,
      createdAt: CREATED_AT,
      email: 'leitor@example.com',
      id: ID,
      message: 'Mensagem válida para contato.',
      name: 'Leitor',
      readAt: null,
      status: PrismaContactMessageStatus.RECEIVED,
      subject: 'Sugestão',
      updatedAt: CREATED_AT,
    });
  });

  it('restaura uma mensagem lida sem perder o estado', () => {
    const readAt = new Date('2026-08-26T11:00:00.000Z');
    const contactMessage = ContactMessageMapper.toDomain({
      archivedAt: null,
      createdAt: CREATED_AT,
      email: 'leitor@example.com',
      id: ID,
      message: 'Mensagem válida para contato.',
      name: 'Leitor',
      readAt,
      status: PrismaContactMessageStatus.READ,
      subject: 'Sugestão',
      updatedAt: readAt,
    });

    expect(contactMessage.status).toBe(ContactMessageStatus.READ);
    expect(contactMessage.readAt).toEqual(readAt);
  });
});
