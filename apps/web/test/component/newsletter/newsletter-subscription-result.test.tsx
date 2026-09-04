import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NewsletterSubscriptionResult } from '@web/features/newsletter/components/newsletter-subscription-result';

const newsletterLinkMocks = vi.hoisted(() => ({
  confirm: vi.fn(),
  unsubscribe: vi.fn(),
}));

vi.mock('@web/features/newsletter/services/manage-newsletter-subscription', () => ({
  confirmNewsletterSubscription: newsletterLinkMocks.confirm,
  unsubscribeFromNewsletter: newsletterLinkMocks.unsubscribe,
}));

describe('resultado do link da newsletter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    newsletterLinkMocks.confirm.mockResolvedValue(undefined);
    newsletterLinkMocks.unsubscribe.mockResolvedValue(undefined);
    window.history.replaceState({}, '', '/');
  });

  it('confirma a inscrição e remove o token da URL', async () => {
    const token = 'A'.repeat(43);
    window.history.replaceState({}, '', `/newsletter/confirm#token=${token}`);

    render(<NewsletterSubscriptionResult action="confirm" />);

    expect(await screen.findByText(/Inscrição confirmada!/i)).toBeInTheDocument();
    expect(newsletterLinkMocks.confirm).toHaveBeenCalledWith(token);
    expect(window.location.hash).toBe('');
  });

  it('cancela a inscrição por um link válido', async () => {
    const token = 'B'.repeat(43);
    window.history.replaceState({}, '', `/newsletter/unsubscribe#token=${token}`);

    render(<NewsletterSubscriptionResult action="unsubscribe" />);

    expect(await screen.findByText(/Inscrição cancelada/i)).toBeInTheDocument();
    expect(newsletterLinkMocks.unsubscribe).toHaveBeenCalledWith(token);
  });

  it('orienta o leitor quando o link não contém um token válido', async () => {
    window.history.replaceState({}, '', '/newsletter/confirm');

    render(<NewsletterSubscriptionResult action="confirm" />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/não é válido/i);
    });
    expect(newsletterLinkMocks.confirm).not.toHaveBeenCalled();
  });
});
