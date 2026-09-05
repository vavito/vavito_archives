import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ArticleImageForm } from '@web/features/admin/editor/article-image-form';
import { ARTICLE_IMAGE_LIMITS } from '@web/features/admin/schemas/article-image.schema';
import type { UploadArticleImage } from '@web/features/admin/types/admin-media.types';

describe('formulário de imagem editorial', () => {
  it('exige arquivo e descrição acessível antes do upload', () => {
    const uploadImage = vi.fn<UploadArticleImage>();
    render(<ArticleImageForm onClose={vi.fn()} onUploaded={vi.fn()} uploadImage={uploadImage} />);

    fireEvent.click(screen.getByRole('button', { name: 'Inserir imagem' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Escolha uma imagem para continuar.');

    fireEvent.change(screen.getByLabelText('Arquivo'), {
      target: { files: [new File(['imagem'], 'artigo.webp', { type: 'image/webp' })] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Inserir imagem' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Descreva a imagem para leitores que não conseguem visualizá-la.',
    );
    expect(uploadImage).not.toHaveBeenCalled();
  });

  it('rejeita formato e tamanho incompatíveis com o contrato da API', () => {
    const uploadImage = vi.fn<UploadArticleImage>();
    const { rerender } = render(
      <ArticleImageForm onClose={vi.fn()} onUploaded={vi.fn()} uploadImage={uploadImage} />,
    );

    fireEvent.change(screen.getByLabelText('Arquivo'), {
      target: { files: [new File(['gif'], 'animacao.gif', { type: 'image/gif' })] },
    });
    fireEvent.change(screen.getByLabelText('Descrição da imagem'), {
      target: { value: 'Animação' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Inserir imagem' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Escolha uma imagem JPG, PNG ou WebP.');

    rerender(<ArticleImageForm onClose={vi.fn()} onUploaded={vi.fn()} uploadImage={uploadImage} />);
    const oversizedFile = new File(['imagem'], 'grande.png', { type: 'image/png' });
    Object.defineProperty(oversizedFile, 'size', { value: ARTICLE_IMAGE_LIMITS.maxBytes + 1 });
    fireEvent.change(screen.getByLabelText('Arquivo'), { target: { files: [oversizedFile] } });
    fireEvent.click(screen.getByRole('button', { name: 'Inserir imagem' }));
    expect(screen.getByRole('alert')).toHaveTextContent('A imagem deve ter no máximo 10 MB.');
  });

  it('exibe o percentual recebido enquanto o envio está pendente', async () => {
    const uploadImage = vi.fn<UploadArticleImage>().mockImplementation(
      (_file, _altText, options) =>
        new Promise(() => {
          options?.onProgress?.({ loadedBytes: 45, percentage: 45, totalBytes: 100 });
        }),
    );
    render(<ArticleImageForm onClose={vi.fn()} onUploaded={vi.fn()} uploadImage={uploadImage} />);

    fireEvent.change(screen.getByLabelText('Arquivo'), {
      target: { files: [new File(['imagem'], 'artigo.jpg', { type: 'image/jpeg' })] },
    });
    fireEvent.change(screen.getByLabelText('Descrição da imagem'), {
      target: { value: 'Foto do artigo' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Inserir imagem' }));

    expect(await screen.findByRole('progressbar', { name: 'Progresso do envio' })).toHaveAttribute(
      'aria-valuenow',
      '45',
    );
    expect(screen.getByText('45%')).toBeInTheDocument();
  });

  it('cancela o envio em andamento ao fechar o formulário', async () => {
    const onClose = vi.fn();
    let uploadSignal: AbortSignal | undefined;
    const uploadImage = vi.fn<UploadArticleImage>().mockImplementation(
      (_file, _altText, options) =>
        new Promise((_resolve, reject) => {
          uploadSignal = options?.signal;
          options?.signal?.addEventListener('abort', () => {
            reject(new DOMException('Upload cancelado.', 'AbortError'));
          });
        }),
    );
    render(<ArticleImageForm onClose={onClose} onUploaded={vi.fn()} uploadImage={uploadImage} />);

    fireEvent.change(screen.getByLabelText('Arquivo'), {
      target: { files: [new File(['imagem'], 'artigo.png', { type: 'image/png' })] },
    });
    fireEvent.change(screen.getByLabelText('Descrição da imagem'), {
      target: { value: 'Foto do artigo' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Inserir imagem' }));
    await screen.findByRole('progressbar', { name: 'Progresso do envio' });

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(uploadSignal?.aborted).toBe(true);
    expect(onClose).toHaveBeenCalledOnce();
  });
});
