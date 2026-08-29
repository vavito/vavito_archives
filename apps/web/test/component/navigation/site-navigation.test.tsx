import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SiteNavigation } from '@web/components/navigation/site-navigation';

const navigationMocks = vi.hoisted(() => ({
  usePathname: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: navigationMocks.usePathname,
}));

describe('SiteNavigation', () => {
  beforeEach(() => {
    navigationMocks.usePathname.mockReturnValue('/artigos/nextjs-com-app-router');
  });

  it('identifica a seção ativa também em uma rota descendente', () => {
    render(<SiteNavigation />);

    expect(screen.getByRole('navigation', { name: 'Navegação principal' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Artigos' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Sobre' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: 'Contato' })).not.toHaveAttribute('aria-current');
  });
});
