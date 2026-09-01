import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SiteFooter } from '@web/components/layout/site-footer';

describe('SiteFooter', () => {
  it('oferece acesso às páginas institucionais', () => {
    render(<SiteFooter />);

    const navigation = screen.getByRole('navigation', { name: 'Links do rodapé' });

    expect(navigation).toContainElement(screen.getByRole('link', { name: 'Sobre' }));
    expect(screen.getByRole('link', { name: 'Sobre' })).toHaveAttribute('href', '/sobre');
    expect(screen.getByRole('link', { name: 'Privacidade' })).toHaveAttribute(
      'href',
      '/privacidade',
    );
    expect(screen.getByRole('link', { name: 'Contato' })).toHaveAttribute('href', '/contato');
  });
});
