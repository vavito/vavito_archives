import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { NotFoundPage } from '@web/components/feedback/not-found-page';

describe('NotFoundPage', () => {
  it('apresenta o erro global em português e oferece retorno para a página inicial', () => {
    render(<NotFoundPage />);

    expect(screen.getByText('Erro 404')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Página não encontrada.' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir para a página inicial' })).toHaveAttribute(
      'href',
      '/',
    );
  });

  it('aceita uma explicação específica para artigos indisponíveis', () => {
    render(
      <NotFoundPage
        description="Este artigo não está disponível."
        title="Artigo não encontrado."
      />,
    );

    expect(screen.getByRole('heading', { name: 'Artigo não encontrado.' })).toBeInTheDocument();
    expect(screen.getByText('Este artigo não está disponível.')).toBeInTheDocument();
  });
});
