import { PrismaService } from '@api/core/database/prisma.service';
import type { ContactMessage } from '@api/modules/contact/domain/entities/contact-message.entity';
import { ContactMessageMapper } from '@api/modules/contact/mappers/contact-message.mapper';
import { ContactMessagesRepository } from '@api/modules/contact/repositories/contact-messages.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PrismaContactMessagesRepository implements ContactMessagesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(contactMessage: ContactMessage): Promise<void> {
    await this.prisma.contactMessage.create({
      data: ContactMessageMapper.toPersistence(contactMessage),
    });
  }

  async findById(id: string): Promise<ContactMessage | null> {
    const record = await this.prisma.contactMessage.findUnique({ where: { id } });
    return record ? ContactMessageMapper.toDomain(record) : null;
  }

  async save(contactMessage: ContactMessage): Promise<void> {
    await this.prisma.contactMessage.update({
      data: ContactMessageMapper.toUpdate(contactMessage),
      where: { id: contactMessage.id },
    });
  }
}
