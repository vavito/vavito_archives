export type AuthMode = 'sign-in' | 'sign-up';

export type AuthField = 'displayName' | 'email' | 'password' | 'passwordConfirmation';

export type AuthFieldErrors = Partial<Record<AuthField, string>>;

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials extends SignInCredentials {
  displayName: string;
}

export type SignUpResult = { status: 'authenticated' | 'confirmation-required' };
