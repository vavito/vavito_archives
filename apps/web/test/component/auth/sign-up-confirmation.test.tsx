import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SignUpConfirmation } from '@web/features/auth/components/sign-up-confirmation';

const confirmationMocks = vi.hoisted(() => ({
  resend: vi.fn(),
}));

vi.mock('@web/features/auth/services/auth.service', () => ({
  SafeAuthError: class SafeAuthError extends Error {},
  resendSignUpConfirmation: confirmationMocks.resend,
}));

describe('confirmação após o cadastro', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    confirmationMocks.resend.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('apresenta o destino e libera o reenvio depois de um minuto', async () => {
    render(
      <SignUpConfirmation
        email="leitor@example.com"
        emailRedirectTo="https://vavitoarchives.com.br/auth/callback"
        onReturnToSignIn={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Cadastro realizado!' })).toBeInTheDocument();
    expect(screen.getByText(/leitor@example.com/)).toBeInTheDocument();

    await act(() => vi.advanceTimersByTimeAsync(60_000));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Reenviar e-mail' }));
      await Promise.resolve();
    });

    expect(confirmationMocks.resend).toHaveBeenCalledWith(
      'leitor@example.com',
      'https://vavitoarchives.com.br/auth/callback',
    );
  });
});
