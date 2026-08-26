export interface NewCommentNotification {
  authorDisplayName: string;
  commentContent: string;
  commentId: string;
  isReply: boolean;
  postTitle: string;
}

export interface ContactMessageNotification {
  contactMessageId: string;
  message: string;
  name: string;
  replyTo: string;
  subject: string;
}

export interface NewsletterConfirmationNotification {
  confirmationToken: string;
  confirmationTokenHash: string;
  recipient: string;
  subscriberId: string;
  unsubscribeToken: string;
}

export interface NewsletterCampaignNotification {
  articleUrl: string;
  campaignId: string;
  deliveryId: string;
  htmlSnapshot: string;
  previewText: string;
  recipient: string;
  subject: string;
  unsubscribeToken: string;
}

export interface MailDelivery {
  messageId: string;
  provider: 'resend';
}

export abstract class MailService {
  abstract sendContactMessageNotification(
    notification: ContactMessageNotification,
  ): Promise<MailDelivery>;
  abstract sendNewCommentNotification(notification: NewCommentNotification): Promise<MailDelivery>;
  abstract sendNewsletterConfirmation(
    notification: NewsletterConfirmationNotification,
  ): Promise<MailDelivery>;
  abstract sendNewsletterCampaign(
    notification: NewsletterCampaignNotification,
  ): Promise<MailDelivery>;
}
