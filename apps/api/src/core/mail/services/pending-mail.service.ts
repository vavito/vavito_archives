import { Injectable, Logger } from '@nestjs/common';

import { MailService, type NewCommentNotification } from '@api/core/mail/services/mail.service';

@Injectable()
export class PendingMailService implements MailService {
  private readonly logger = new Logger(PendingMailService.name);

  sendNewCommentNotification(notification: NewCommentNotification): Promise<void> {
    this.logger.debug(
      `Notificação do comentário ${notification.commentId} aguardando integração Resend.`,
    );
    return Promise.resolve();
  }
}
