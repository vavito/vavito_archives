import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { RouteMotion } from '@web/components/feedback/route-motion';

vi.mock('next/navigation', () => ({
  usePathname: () => '/artigos',
}));

describe('RouteMotion', () => {
  it('identifica a rota e aplica a entrada global ao conteúdo', () => {
    render(
      <RouteMotion className="custom-class">
        <h1>Artigos</h1>
      </RouteMotion>,
    );

    const container = screen.getByRole('heading', { name: 'Artigos' }).parentElement;

    expect(container).toHaveAttribute('data-route-motion', '/artigos');
    expect(container).toHaveClass('page-route-enter', 'page-content-sequence', 'custom-class');
  });
});
