export interface MailWebhookHeaders {
  id?: string;
  signature?: string;
  timestamp?: string;
}

export interface VerifyMailWebhookInput {
  headers: MailWebhookHeaders;
  payload: string;
}

export interface VerifiedMailWebhookEvent {
  bounceSubType: string | null;
  bounceType: string | null;
  occurredAt: Date;
  payloadHash: string;
  providerEmailId: string | null;
  providerEventId: string;
  type: string;
}

export abstract class MailWebhookVerifier {
  abstract verify(input: VerifyMailWebhookInput): VerifiedMailWebhookEvent;
}
