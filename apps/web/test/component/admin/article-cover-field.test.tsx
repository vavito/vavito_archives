import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ArticleCoverField } from '@web/features/admin/editor/article-cover-field';

describe('capa do artigo no editor', () => {
  it('envia uma imagem e a seleciona como capa', async () => {
    const onChange = vi.fn();
    const uploadImage = vi.fn().mockResolvedValue({
      altText: 'Mesa com caderno e notebook',
      height: 900,
      id: '019c2d62-6e90-7000-8000-000000000020',
      mimeType: 'image/webp',
      url: 'https://storage.test/media/capa.webp',
      width: 1600,
    });

    render(
      <ArticleCoverField altText={null} onChange={onChange} uploadImage={uploadImage} url={null} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Adicionar capa' }));
    fireEvent.change(screen.getByLabelText('Arquivo'), {
      target: { files: [new File(['imagem'], 'capa.webp', { type: 'image/webp' })] },
    });
    fireEvent.change(screen.getByLabelText('Descrição da imagem'), {
      target: { value: 'Mesa com caderno e notebook' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Usar como capa' }));

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith({
        altText: 'Mesa com caderno e notebook',
        mediaId: '019c2d62-6e90-7000-8000-000000000020',
        positionX: 50,
        positionY: 50,
        scale: 100,
        url: 'https://storage.test/media/capa.webp',
      });
    });
  });

  it('permite remover a capa atual', () => {
    const onChange = vi.fn();

    render(
      <ArticleCoverField
        altText="Capa atual"
        onChange={onChange}
        url="https://storage.test/media/capa.webp"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Remover' }));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('ajusta o zoom e reposiciona a capa após o clique duplo', () => {
    const onChange = vi.fn();
    render(
      <ArticleCoverField
        altText="Capa atual"
        mediaId="019c2d62-6e90-7000-8000-000000000020"
        onChange={onChange}
        positionX={50}
        positionY={50}
        scale={110}
        url="https://storage.test/media/capa.webp"
      />,
    );
    const cover = screen.getByRole('button', {
      name: 'Clique duas vezes para ajustar a capa',
    });
    Object.assign(cover, {
      getBoundingClientRect: () => ({ height: 300, width: 500 }),
      hasPointerCapture: vi.fn().mockReturnValue(true),
      releasePointerCapture: vi.fn(),
      setPointerCapture: vi.fn(),
    });

    fireEvent.doubleClick(cover);
    fireEvent.click(screen.getByRole('button', { name: 'Aumentar zoom da capa' }));
    expect(onChange).toHaveBeenCalledWith({
      altText: 'Capa atual',
      mediaId: '019c2d62-6e90-7000-8000-000000000020',
      positionX: 50,
      positionY: 50,
      scale: 115,
      url: 'https://storage.test/media/capa.webp',
    });

    fireEvent.pointerDown(cover, { clientX: 200, clientY: 200, pointerId: 1 });
    fireEvent.pointerMove(cover, { clientX: 150, clientY: 160, pointerId: 1 });
    fireEvent.pointerUp(cover, { pointerId: 1 });

    expect(onChange).toHaveBeenCalledWith({
      altText: 'Capa atual',
      mediaId: '019c2d62-6e90-7000-8000-000000000020',
      positionX: 60,
      positionY: 63,
      scale: 110,
      url: 'https://storage.test/media/capa.webp',
    });
    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
  });
});
