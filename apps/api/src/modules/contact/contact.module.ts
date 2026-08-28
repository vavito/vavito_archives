import { MailModule } from '@api/core/mail/mail.module';
import { ContactController } from '@api/modules/contact/controllers/contact.controller';
import { ContactMessagesRepository } from '@api/modules/contact/repositories/contact-messages.repository';
import { PrismaContactMessagesRepository } from '@api/modules/contact/repositories/prisma-contact-messages.repository';
import { ContactService } from '@api/modules/contact/services/contact.service';
import { Module } from '@nestjs/common';

@Module({
  controllers: [ContactController],
  imports: [MailModule],
  providers: [
    ContactService,
    { provide: ContactMessagesRepository, useClass: PrismaContactMessagesRepository },
  ],
})
export class ContactModule {}
