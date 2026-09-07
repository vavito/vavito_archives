import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { UnauthorizedPage } from '@web/components/feedback/unauthorized-page';

describe('UnauthorizedPage', () => {
  it('explica a restrição e oferece retorno para a página inicial', () => {
    render(<UnauthorizedPage />);

    expect(screen.getByText('Acesso não autorizado')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Você não tem permissão para acessar esta página.' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir para a página inicial' })).toHaveAttribute(
      'href',
      '/',
    );
  });
});
