export interface NewCommentNotification {
  authorDisplayName: string;
  authorId: string;
  commentId: string;
  createdAt: Date;
  isReply: boolean;
  postId: string;
  postSlug: string;
  postTitle: string;
}

export abstract class MailService {
  abstract sendNewCommentNotification(notification: NewCommentNotification): Promise<void>;
}
