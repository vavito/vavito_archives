import type { ContactMessage } from '@api/modules/contact/domain/entities/contact-message.entity';

export abstract class ContactMessagesRepository {
  abstract create(contactMessage: ContactMessage): Promise<void>;
  abstract findById(id: string): Promise<ContactMessage | null>;
  abstract save(contactMessage: ContactMessage): Promise<void>;
}
