import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NewsletterSignup } from '@web/features/newsletter/components/newsletter-signup';

const newsletterMocks = vi.hoisted(() => ({
  subscribeToNewsletter: vi.fn(),
}));

vi.mock('@web/features/newsletter/services/subscribe-newsletter', () => newsletterMocks);

describe('NewsletterSignup', () => {
  beforeEach(() => {
    newsletterMocks.subscribeToNewsletter.mockResolvedValue(undefined);
  });

  it('solicita a inscrição e orienta a confirmação por e-mail', async () => {
    render(<NewsletterSignup />);

    fireEvent.change(screen.getByLabelText('Seu melhor e-mail'), {
      target: { value: 'leitor@example.com' },
    });
    fireEvent.click(
      screen.getByRole('checkbox', {
        name: /Concordo em receber os novos artigos por e-mail/i,
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Quero receber' }));

    await waitFor(() => {
      expect(newsletterMocks.subscribeToNewsletter).toHaveBeenCalledWith('leitor@example.com');
    });
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Confira sua caixa de entrada para confirmar a inscrição.',
    );
  });
});
