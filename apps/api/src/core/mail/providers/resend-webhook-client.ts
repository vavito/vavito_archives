import type { WebhookEventPayload } from 'resend';

export interface VerifyResendWebhookOptions {
  headers: {
    id: string;
    signature: string;
    timestamp: string;
  };
  payload: string;
  webhookSecret: string;
}

export interface ResendWebhookClient {
  verify(options: VerifyResendWebhookOptions): WebhookEventPayload;
}
