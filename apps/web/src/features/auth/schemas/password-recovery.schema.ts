import {
  isStrongPassword,
  isValidEmail,
  normalizeEmail,
  PASSWORD_REQUIREMENTS_ERROR,
} from './auth-credentials.schema';
import type { PasswordRecoveryFieldErrors } from '../types/auth.types';

function formValue(formData: FormData, field: string, trim = true): string {
  const value = formData.get(field);
  return typeof value === 'string' ? (trim ? value.trim() : value) : '';
}

export function validateRecoveryEmail(formData: FormData): {
  email: string;
  errors: PasswordRecoveryFieldErrors;
} {
  const email = normalizeEmail(formValue(formData, 'email'));

  return {
    email,
    errors: isValidEmail(email) ? {} : { email: 'Informe um endereço de e-mail válido.' },
  };
}

export function validateNewPassword(formData: FormData): {
  errors: PasswordRecoveryFieldErrors;
  password: string;
} {
  const password = formValue(formData, 'password', false);
  const passwordConfirmation = formValue(formData, 'passwordConfirmation', false);
  const errors: PasswordRecoveryFieldErrors = {};

  if (!isStrongPassword(password)) {
    errors.password = PASSWORD_REQUIREMENTS_ERROR;
  }

  if (passwordConfirmation !== password) {
    errors.passwordConfirmation = 'As senhas precisam ser iguais.';
  }

  return { errors, password };
}
