import type {
  AuthFieldErrors,
  AuthMode,
  SignInCredentials,
  SignUpCredentials,
} from '../types/auth.types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
const LOWERCASE_PATTERN = /[a-z]/u;
const UPPERCASE_PATTERN = /[A-Z]/u;
const NUMBER_PATTERN = /\d/u;
const SYMBOL_PATTERN = /[^\p{L}\p{N}\s]/u;

export const AUTH_LIMITS = {
  displayName: { max: 120, min: 2 },
  email: 320,
  password: { max: 128, min: 8 },
} as const;

export const PASSWORD_REQUIREMENTS =
  'Use 8 ou mais caracteres, incluindo letra maiúscula, minúscula, número e símbolo.';

export const PASSWORD_REQUIREMENTS_ERROR = 'A senha ainda não atende a todos os critérios.';

export interface AuthValidationResult {
  errors: AuthFieldErrors;
  values: SignInCredentials & { displayName: string; passwordConfirmation: string };
}

function formValue(formData: FormData, field: string, trim = true): string {
  const value = formData.get(field);
  return typeof value === 'string' ? (trim ? value.trim() : value) : '';
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email) && email.length <= AUTH_LIMITS.email;
}

export function isStrongPassword(password: string): boolean {
  return (
    password.length >= AUTH_LIMITS.password.min &&
    password.length <= AUTH_LIMITS.password.max &&
    LOWERCASE_PATTERN.test(password) &&
    UPPERCASE_PATTERN.test(password) &&
    NUMBER_PATTERN.test(password) &&
    SYMBOL_PATTERN.test(password)
  );
}

export function validateAuthCredentials(formData: FormData, mode: AuthMode): AuthValidationResult {
  const values = {
    displayName: formValue(formData, 'displayName'),
    email: normalizeEmail(formValue(formData, 'email')),
    password: formValue(formData, 'password', false),
    passwordConfirmation: formValue(formData, 'passwordConfirmation', false),
  };
  const errors: AuthFieldErrors = {};

  if (!isValidEmail(values.email)) {
    errors.email = 'Informe um endereço de e-mail válido.';
  }

  if (!values.password) {
    errors.password = 'Informe sua senha.';
  }

  if (mode === 'sign-up') {
    if (values.displayName.length < AUTH_LIMITS.displayName.min) {
      errors.displayName = 'Informe seu nome com pelo menos 2 caracteres.';
    } else if (values.displayName.length > AUTH_LIMITS.displayName.max) {
      errors.displayName = 'O nome deve ter no máximo 120 caracteres.';
    }

    if (!isStrongPassword(values.password)) {
      errors.password = PASSWORD_REQUIREMENTS_ERROR;
    }

    if (values.passwordConfirmation !== values.password) {
      errors.passwordConfirmation = 'As senhas precisam ser iguais.';
    }
  }

  return { errors, values };
}

export function toSignInCredentials(result: AuthValidationResult): SignInCredentials {
  return { email: result.values.email, password: result.values.password };
}

export function toSignUpCredentials(result: AuthValidationResult): SignUpCredentials {
  return {
    displayName: result.values.displayName,
    email: result.values.email,
    password: result.values.password,
  };
}
