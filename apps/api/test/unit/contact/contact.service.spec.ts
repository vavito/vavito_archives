import { Logger } from '@nestjs/common';

import type { MailService } from '@api/core/mail/services/mail.service';
import { CONTACT_ACCEPTED_MESSAGE } from '@api/modules/contact/contact.constants';
import type { ContactMessagesRepository } from '@api/modules/contact/repositories/contact-messages.repository';
import { ContactService } from '@api/modules/contact/services/contact.service';

describe('ContactService', () => {
  const create = jest.fn();
  const repository = { create } as unknown as ContactMessagesRepository;
  const sendContactMessageNotification = jest.fn();
  const mailService = { sendContactMessageNotification } as unknown as MailService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it('persiste antes de solicitar o envio e retorna uma resposta genérica', async () => {
    create.mockResolvedValueOnce(undefined);
    sendContactMessageNotification.mockResolvedValueOnce({
      messageId: 'resend-message-id',
      provider: 'resend',
    });
    const service = new ContactService(repository, mailService);

    await expect(
      service.create({
        email: 'leitor@example.com',
        message: 'Gostaria de sugerir uma nova pauta.',
        name: 'Leitor',
        subject: 'Sugestão',
      }),
    ).resolves.toEqual({ message: CONTACT_ACCEPTED_MESSAGE });

    expect(create).toHaveBeenCalledTimes(1);
    expect(sendContactMessageNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Gostaria de sugerir uma nova pauta.',
        name: 'Leitor',
        replyTo: 'leitor@example.com',
        subject: 'Sugestão',
      }),
    );
    expect(create.mock.invocationCallOrder[0]).toBeLessThan(
      sendContactMessageNotification.mock.invocationCallOrder[0]!,
    );
  });

  it('mantém a resposta 202 quando a notificação falha depois da persistência', async () => {
    create.mockResolvedValueOnce(undefined);
    sendContactMessageNotification.mockRejectedValueOnce(new Error('Resend indisponível'));
    const service = new ContactService(repository, mailService);

    await expect(
      service.create({
        email: 'leitor@example.com',
        message: 'Gostaria de sugerir uma nova pauta.',
        name: 'Leitor',
      }),
    ).resolves.toEqual({ message: CONTACT_ACCEPTED_MESSAGE });
    expect(create).toHaveBeenCalledTimes(1);
  });
});
