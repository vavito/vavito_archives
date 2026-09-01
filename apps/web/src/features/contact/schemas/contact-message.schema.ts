import type { ContactFieldErrors, ContactMessage } from '../types/contact.types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

export const CONTACT_LIMITS = {
  email: 320,
  message: { max: 5000, min: 10 },
  name: { max: 120, min: 2 },
} as const;

export interface ContactValidationResult {
  errors: ContactFieldErrors;
  values: ContactMessage;
}

function formValue(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === 'string' ? value.trim() : '';
}

export function validateContactMessage(formData: FormData): ContactValidationResult {
  const values = {
    email: formValue(formData, 'email').toLowerCase(),
    message: formValue(formData, 'message'),
    name: formValue(formData, 'name'),
  };
  const errors: ContactFieldErrors = {};

  if (values.name.length < CONTACT_LIMITS.name.min) {
    errors.name = 'Informe seu nome com pelo menos 2 caracteres.';
  } else if (values.name.length > CONTACT_LIMITS.name.max) {
    errors.name = 'O nome deve ter no máximo 120 caracteres.';
  }

  if (!EMAIL_PATTERN.test(values.email) || values.email.length > CONTACT_LIMITS.email) {
    errors.email = 'Informe um endereço de e-mail válido.';
  }

  if (values.message.length < CONTACT_LIMITS.message.min) {
    errors.message = 'Escreva uma mensagem com pelo menos 10 caracteres.';
  } else if (values.message.length > CONTACT_LIMITS.message.max) {
    errors.message = 'A mensagem deve ter no máximo 5.000 caracteres.';
  }

  return { errors, values };
}
