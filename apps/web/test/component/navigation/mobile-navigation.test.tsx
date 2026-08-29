import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MobileNavigation } from '@web/components/navigation/mobile-navigation';

const navigationMocks = vi.hoisted(() => ({
  usePathname: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: navigationMocks.usePathname,
}));

describe('MobileNavigation', () => {
  beforeEach(() => {
    navigationMocks.usePathname.mockReturnValue('/');
  });

  it('mantém somente o link da rota inicial como ativo', () => {
    render(<MobileNavigation />);

    expect(screen.getByRole('navigation', { name: 'Navegação móvel' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Início' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Artigos' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: 'Salvos' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: 'Perfil' })).not.toHaveAttribute('aria-current');
  });
});
