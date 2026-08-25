export interface NewCommentNotification {
  authorDisplayName: string;
  commentContent: string;
  commentId: string;
  isReply: boolean;
  postTitle: string;
}

export interface NewsletterConfirmationNotification {
  confirmationToken: string;
  confirmationTokenHash: string;
  recipient: string;
  subscriberId: string;
  unsubscribeToken: string;
}

export interface MailDelivery {
  messageId: string;
  provider: 'resend';
}

export abstract class MailService {
  abstract sendNewCommentNotification(notification: NewCommentNotification): Promise<MailDelivery>;
  abstract sendNewsletterConfirmation(
    notification: NewsletterConfirmationNotification,
  ): Promise<MailDelivery>;
}
