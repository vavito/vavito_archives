import type { CreateEmailOptions, CreateEmailRequestOptions, CreateEmailResponse } from 'resend';

export interface ResendEmailClient {
  send(
    payload: CreateEmailOptions,
    options?: CreateEmailRequestOptions,
  ): Promise<CreateEmailResponse>;
}
