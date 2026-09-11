import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ProgressiveImage } from '@web/components/feedback/progressive-image';

describe('ProgressiveImage', () => {
  it('mantém o carregamento padronizado até a imagem terminar', async () => {
    render(
      <ProgressiveImage
        alt="Capa de teste"
        height={630}
        loadingLabel="Carregando capa de teste"
        src="https://cdn.example.com/capa.webp"
        width={1200}
      />,
    );

    expect(screen.getByRole('status', { name: 'Carregando capa de teste' })).toHaveClass(
      'image-loading',
    );

    fireEvent.load(screen.getByAltText('Capa de teste'));

    await waitFor(() => {
      expect(screen.queryByRole('status', { name: 'Carregando capa de teste' })).toBeNull();
    });
  });

  it('encerra o carregamento quando a imagem falha', async () => {
    render(
      <ProgressiveImage
        alt="Imagem indisponível"
        height={630}
        src="https://cdn.example.com/inexistente.webp"
        width={1200}
      />,
    );

    fireEvent.error(screen.getByAltText('Imagem indisponível'));

    await waitFor(() => {
      expect(screen.queryByRole('status', { name: 'Carregando imagem' })).toBeNull();
    });
    expect(screen.getByText('Imagem indisponível', { selector: 'span' })).toHaveClass(
      'items-center',
      'justify-center',
      'text-center',
    );
    expect(screen.getByRole('img', { name: 'Imagem indisponível' })).toHaveClass('opacity-0');
  });

  it('não oculta uma imagem prioritária enquanto aguarda a hidratação', () => {
    render(
      <ProgressiveImage
        alt="Capa principal"
        height={675}
        preload
        src="https://cdn.example.com/principal.webp"
        width={1200}
      />,
    );

    expect(screen.getByRole('img', { name: 'Capa principal' })).toHaveClass('opacity-100');
    expect(screen.getByRole('status', { name: 'Carregando imagem' })).toBeInTheDocument();
  });
});
