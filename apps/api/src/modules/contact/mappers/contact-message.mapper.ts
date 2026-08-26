import type { ContactMessage as PrismaContactMessage, Prisma } from '@api/generated/prisma/client';
import { ContactMessageStatus as PrismaContactMessageStatus } from '@api/generated/prisma/client';
import { ContactMessage } from '@api/modules/contact/domain/entities/contact-message.entity';
import { ContactMessageStatus } from '@api/modules/contact/domain/enums/contact-message-status.enum';

const domainStatusByPrisma: Readonly<Record<PrismaContactMessageStatus, ContactMessageStatus>> = {
  [PrismaContactMessageStatus.ARCHIVED]: ContactMessageStatus.ARCHIVED,
  [PrismaContactMessageStatus.READ]: ContactMessageStatus.READ,
  [PrismaContactMessageStatus.RECEIVED]: ContactMessageStatus.RECEIVED,
};

const prismaStatusByDomain: Readonly<Record<ContactMessageStatus, PrismaContactMessageStatus>> = {
  [ContactMessageStatus.ARCHIVED]: PrismaContactMessageStatus.ARCHIVED,
  [ContactMessageStatus.READ]: PrismaContactMessageStatus.READ,
  [ContactMessageStatus.RECEIVED]: PrismaContactMessageStatus.RECEIVED,
};

function persistenceFields(contactMessage: ContactMessage) {
  return {
    archivedAt: contactMessage.archivedAt,
    email: contactMessage.email,
    message: contactMessage.message,
    name: contactMessage.name,
    readAt: contactMessage.readAt,
    status: prismaStatusByDomain[contactMessage.status],
    subject: contactMessage.subject,
    updatedAt: contactMessage.updatedAt,
  };
}

export class ContactMessageMapper {
  static toDomain(record: PrismaContactMessage): ContactMessage {
    return ContactMessage.restore({
      archivedAt: record.archivedAt,
      createdAt: record.createdAt,
      email: record.email,
      id: record.id,
      message: record.message,
      name: record.name,
      readAt: record.readAt,
      status: domainStatusByPrisma[record.status],
      subject: record.subject,
      updatedAt: record.updatedAt,
    });
  }

  static toPersistence(contactMessage: ContactMessage): Prisma.ContactMessageCreateInput {
    return {
      ...persistenceFields(contactMessage),
      createdAt: contactMessage.createdAt,
      id: contactMessage.id,
    };
  }

  static toUpdate(contactMessage: ContactMessage): Prisma.ContactMessageUpdateInput {
    return persistenceFields(contactMessage);
  }
}
