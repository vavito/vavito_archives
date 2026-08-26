import { randomUUID } from 'node:crypto';

import { MailService } from '@api/core/mail/services/mail.service';
import { CONTACT_ACCEPTED_MESSAGE } from '@api/modules/contact/contact.constants';
import { ContactMessage } from '@api/modules/contact/domain/entities/contact-message.entity';
import type { CreateContactMessageDto } from '@api/modules/contact/dto/request/create-contact-message.dto';
import type { ContactAcceptedResponseDto } from '@api/modules/contact/dto/response/contact-accepted-response.dto';
import { throwContactDomainException } from '@api/modules/contact/errors/contact-domain.exception';
import { ContactMessagesRepository } from '@api/modules/contact/repositories/contact-messages.repository';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    private readonly contactMessagesRepository: ContactMessagesRepository,
    private readonly mailService: MailService,
  ) {}

  async create(dto: CreateContactMessageDto): Promise<ContactAcceptedResponseDto> {
    const contactMessage = this.executeDomainAction(() =>
      ContactMessage.create({
        email: dto.email,
        id: randomUUID(),
        message: dto.message,
        name: dto.name,
        now: new Date(),
        ...(dto.subject === undefined ? {} : { subject: dto.subject }),
      }),
    );

    await this.contactMessagesRepository.create(contactMessage);
    void this.sendNotification(contactMessage);

    return { message: CONTACT_ACCEPTED_MESSAGE };
  }

  private async sendNotification(contactMessage: ContactMessage): Promise<void> {
    try {
      const delivery = await this.mailService.sendContactMessageNotification({
        contactMessageId: contactMessage.id,
        message: contactMessage.message,
        name: contactMessage.name,
        replyTo: contactMessage.email,
        subject: contactMessage.subject,
      });
      this.logger.log(
        `Notificação do contato ${contactMessage.id} aceita pelo Resend como ${delivery.messageId}.`,
      );
    } catch (error) {
      this.logger.error(
        `Falha ao notificar o contato ${contactMessage.id}.`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private executeDomainAction<T>(action: () => T): T {
    try {
      return action();
    } catch (error) {
      throwContactDomainException(error);
    }
  }
}
