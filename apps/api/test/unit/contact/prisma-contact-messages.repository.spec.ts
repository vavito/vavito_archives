import type { PrismaService } from '@api/core/database/prisma.service';
import type { ContactMessage as PrismaContactMessage, Prisma } from '@api/generated/prisma/client';
import { ContactMessageStatus as PrismaContactMessageStatus } from '@api/generated/prisma/client';
import { ContactMessage } from '@api/modules/contact/domain/entities/contact-message.entity';
import { PrismaContactMessagesRepository } from '@api/modules/contact/repositories/prisma-contact-messages.repository';

const ID = '49d6cdaa-a5f5-4716-9b27-39006338557b';
const CREATED_AT = new Date('2026-08-26T10:00:00.000Z');

function contactMessage(): ContactMessage {
  return ContactMessage.create({
    email: 'leitor@example.com',
    id: ID,
    message: 'Mensagem válida para contato.',
    name: 'Leitor',
    now: CREATED_AT,
    subject: 'Sugestão',
  });
}

function record(): PrismaContactMessage {
  return {
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
  };
}

describe('PrismaContactMessagesRepository', () => {
  const create = jest.fn<Promise<PrismaContactMessage>, [Prisma.ContactMessageCreateArgs]>();
  const findUnique = jest.fn<
    Promise<PrismaContactMessage | null>,
    [Prisma.ContactMessageFindUniqueArgs]
  >();
  const update = jest.fn<Promise<PrismaContactMessage>, [Prisma.ContactMessageUpdateArgs]>();
  const prisma = { contactMessage: { create, findUnique, update } } as unknown as PrismaService;
  const repository = new PrismaContactMessagesRepository(prisma);

  beforeEach(() => jest.clearAllMocks());

  it('persiste os dados normalizados da mensagem', async () => {
    create.mockResolvedValueOnce(record());

    await repository.create(contactMessage());

    expect(create.mock.calls[0]?.[0]).toMatchObject({
      data: { email: 'leitor@example.com', id: ID, status: PrismaContactMessageStatus.RECEIVED },
    });
  });

  it('consulta por ID e restaura o domínio', async () => {
    findUnique.mockResolvedValueOnce(record());

    await expect(repository.findById(ID)).resolves.toMatchObject({ id: ID });
    expect(findUnique).toHaveBeenCalledWith({ where: { id: ID } });
  });

  it('salva a transição para READ', async () => {
    const message = contactMessage();
    message.markRead(new Date('2026-08-26T11:00:00.000Z'));

    await repository.save(message);

    expect(update.mock.calls[0]?.[0]).toMatchObject({
      data: { status: PrismaContactMessageStatus.READ },
      where: { id: ID },
    });
  });
});
