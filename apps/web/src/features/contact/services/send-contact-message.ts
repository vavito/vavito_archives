import type { ApiClient } from '@vavito/api-client';

import { createWebPublicApiClient } from '@web/lib/api/api-client';

import type { ContactAcceptedResponse, ContactMessage } from '../types/contact.types';

export async function sendContactMessage(
  message: ContactMessage,
  client: ApiClient = createWebPublicApiClient(),
): Promise<ContactAcceptedResponse> {
  const response = await client.POST('/api/v1/contact', { body: message });

  if (!response.data) {
    throw new Error('Não foi possível confirmar o envio da mensagem.');
  }

  return response.data;
}
