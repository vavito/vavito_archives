import type { components } from '@vavito/api-client';

export type ContactMessage = components['schemas']['CreateContactMessageDto'];
export type ContactAcceptedResponse = components['schemas']['ContactAcceptedResponseDto'];

export type ContactField = 'email' | 'message' | 'name';
export type ContactFieldErrors = Partial<Record<ContactField, string>>;
