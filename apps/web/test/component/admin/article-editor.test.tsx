import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { JSONContent } from '@tiptap/react';

import { ArticleEditor } from '@web/features/admin/editor/article-editor';
import {
  ARTICLE_CONTENT_SCHEMA_VERSION,
  createArticleEditorExtensions,
} from '@web/features/admin/editor/article-editor.config';
import { normalizeArticleLinkHref } from '@web/features/admin/editor/article-link-form';
import type { UploadArticleImage } from '@web/features/admin/types/admin-media.types';

const uploadedImage = {
  altText: 'Diagrama do fluxo editorial',
  height: 630,
  id: '019c2d62-6e90-7000-8000-000000000020',
  mimeType: 'image/webp' as const,
  url: 'https://cdn.example.com/media/diagram.webp',
  width: 1200,
};

describe('editor de artigos', () => {
  it('configura o schema editorial e sua versão', () => {
    const extensions = createArticleEditorExtensions();

    expect(ARTICLE_CONTENT_SCHEMA_VERSION).toBe(1);
    expect(extensions.map((extension) => extension.name)).toEqual([
      'starterKit',
      'image',
      'placeholder',
    ]);
  });

  it('inicializa no cliente e expõe JSON versionado para persistência', async () => {
    const initialContent: JSONContent = {
      content: [
        {
          content: [{ text: 'Primeiro parágrafo', type: 'text' }],
          type: 'paragraph',
        },
      ],
      type: 'doc',
    };
    const { container } = render(<ArticleEditor initialContent={initialContent} />);

    expect(await screen.findByLabelText('Conteúdo do artigo')).toBeInTheDocument();
    expect(container.querySelector('[name="content"]')).toHaveValue(JSON.stringify(initialContent));
    expect(container.querySelector('[name="contentSchemaVersion"]')).toHaveValue('1');
  });

  it('impede a edição do conteúdo quando o artigo está arquivado', async () => {
    render(<ArticleEditor editable={false} />);

    expect(await screen.findByLabelText('Conteúdo do artigo')).toHaveAttribute(
      'contenteditable',
      'false',
    );
    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
  });

  it('oferece as formatações previstas e informa seus atalhos', async () => {
    render(<ArticleEditor />);

    const toolbar = await screen.findByRole('toolbar', { name: 'Ferramentas de formatação' });
    const toolbarQueries = within(toolbar);

    expect(screen.getByRole('textbox', { name: 'Conteúdo do artigo' })).toHaveAttribute(
      'aria-multiline',
      'true',
    );

    expect(toolbarQueries.getByRole('button', { name: 'Título de seção' })).toHaveAttribute(
      'aria-keyshortcuts',
      'Control+Alt+2 Meta+Alt+2',
    );
    expect(toolbarQueries.getByRole('button', { name: 'Subtítulo de seção' })).toBeInTheDocument();
    expect(toolbarQueries.getByRole('button', { name: 'Negrito' })).toBeInTheDocument();
    expect(toolbarQueries.getByRole('button', { name: 'Itálico' })).toBeInTheDocument();
    expect(
      toolbarQueries.getByRole('button', { name: 'Adicionar ou editar link' }),
    ).toBeInTheDocument();
    expect(toolbarQueries.getByRole('button', { name: 'Inserir imagem' })).toBeInTheDocument();
    expect(toolbarQueries.getByRole('button', { name: 'Código em linha' })).toBeInTheDocument();
    expect(toolbarQueries.getByRole('button', { name: 'Bloco de código' })).toBeInTheDocument();
    expect(toolbarQueries.getByRole('button', { name: 'Citação' })).toBeInTheDocument();
    expect(toolbarQueries.getByRole('button', { name: 'Inserir imagem' })).toHaveAttribute(
      'title',
      'Inserir imagem',
    );
  });

  it('aplica títulos pelo toolbar e reflete seu estado ativo', async () => {
    const { container } = render(<ArticleEditor />);
    const headingButton = await screen.findByRole('button', { name: 'Título de seção' });

    fireEvent.click(headingButton);

    await waitFor(() => {
      expect(headingButton).toHaveAttribute('aria-pressed', 'true');
      const document = JSON.parse(
        container.querySelector('[name="content"]')?.getAttribute('value') ?? '',
      ) as JSONContent;
      expect(document.type).toBe('doc');
      expect(document.content?.[0]).toMatchObject({ attrs: { level: 2 }, type: 'heading' });
    });
  });

  it('abre e fecha o editor de link pelo atalho de teclado', async () => {
    render(<ArticleEditor />);
    const content = await screen.findByLabelText('Conteúdo do artigo');

    fireEvent.keyDown(content, { ctrlKey: true, key: 'k' });
    expect(await screen.findByRole('dialog', { name: 'Editar link' })).toBeInTheDocument();

    fireEvent.keyDown(screen.getByLabelText('Endereço do link'), { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Editar link' })).not.toBeInTheDocument();
    });
  });

  it('normaliza endereços sem permitir esquemas inseguros', () => {
    expect(normalizeArticleLinkHref('vavitoarchives.com.br/artigo')).toBe(
      'https://vavitoarchives.com.br/artigo',
    );
    expect(normalizeArticleLinkHref('mailto:contato@vavitoarchives.com.br')).toBe(
      'mailto:contato@vavitoarchives.com.br',
    );
    expect(normalizeArticleLinkHref('javascript:alert(1)')).toBe('https://javascript:alert(1)');
  });

  it('envia uma imagem com descrição e insere o node no documento', async () => {
    const uploadImage = vi
      .fn<UploadArticleImage>()
      .mockImplementation((_file, _altText, options) => {
        options?.onProgress?.({ loadedBytes: 42, percentage: 42, totalBytes: 100 });
        return Promise.resolve(uploadedImage);
      });
    const { container } = render(<ArticleEditor uploadImage={uploadImage} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Inserir imagem' }));
    expect(screen.getByRole('dialog', { name: 'Inserir imagem' }).parentElement).toHaveClass(
      'article-editor-toolbar-panel',
    );
    const file = new File(['imagem'], 'diagrama.webp', { type: 'image/webp' });
    fireEvent.change(screen.getByLabelText('Arquivo'), { target: { files: [file] } });
    fireEvent.change(screen.getByLabelText('Descrição da imagem'), {
      target: { value: '  Diagrama do fluxo editorial  ' },
    });
    fireEvent.click(
      within(screen.getByRole('dialog', { name: 'Inserir imagem' })).getByRole('button', {
        name: 'Inserir imagem',
      }),
    );

    await waitFor(() => {
      expect(uploadImage).toHaveBeenCalledTimes(1);
      const [uploadedFile, uploadedAltText, uploadOptions] = uploadImage.mock.calls[0]!;
      expect(uploadedFile).toBe(file);
      expect(uploadedAltText).toBe('Diagrama do fluxo editorial');
      expect(uploadOptions?.signal).toBeInstanceOf(AbortSignal);
      const document = JSON.parse(
        container.querySelector('[name="content"]')?.getAttribute('value') ?? '',
      ) as JSONContent;
      expect(document.content?.[0]).toMatchObject({
        attrs: {
          alt: uploadedImage.altText,
          height: uploadedImage.height,
          src: uploadedImage.url,
          width: uploadedImage.width,
        },
        type: 'image',
      });
    });
    expect(screen.queryByRole('dialog', { name: 'Inserir imagem' })).not.toBeInTheDocument();
  });

  it('mantém o formulário aberto e não altera o documento quando o upload falha', async () => {
    const uploadImage = vi
      .fn<UploadArticleImage>()
      .mockRejectedValue(new Error('Não foi possível armazenar a imagem.'));
    const { container } = render(<ArticleEditor uploadImage={uploadImage} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Inserir imagem' }));
    fireEvent.change(screen.getByLabelText('Arquivo'), {
      target: { files: [new File(['imagem'], 'diagrama.png', { type: 'image/png' })] },
    });
    fireEvent.change(screen.getByLabelText('Descrição da imagem'), {
      target: { value: 'Diagrama' },
    });
    fireEvent.click(
      within(screen.getByRole('dialog', { name: 'Inserir imagem' })).getByRole('button', {
        name: 'Inserir imagem',
      }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível armazenar a imagem.',
    );
    expect(screen.getByRole('dialog', { name: 'Inserir imagem' })).toBeInTheDocument();
    expect(container.querySelector('.article-editor-content img')).not.toBeInTheDocument();
  });

  it('remove do documento uma imagem selecionada', async () => {
    const initialContent: JSONContent = {
      content: [
        {
          attrs: { alt: uploadedImage.altText, src: uploadedImage.url },
          type: 'image',
        },
      ],
      type: 'doc',
    };
    const { container } = render(<ArticleEditor initialContent={initialContent} />);
    const image = await waitFor(() => {
      const element = container.querySelector('.article-editor-content img');
      expect(element).toBeInTheDocument();
      return element!;
    });
    const originalElementFromPoint = document.elementFromPoint?.bind(document);
    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: () => image,
    });

    try {
      fireEvent.mouseDown(image);
      fireEvent.click(image);
      const removeButton = await screen.findByRole('button', { name: 'Remover imagem' });
      fireEvent.click(removeButton);
    } finally {
      Object.defineProperty(document, 'elementFromPoint', {
        configurable: true,
        value: originalElementFromPoint,
      });
    }

    await waitFor(() => {
      const document = JSON.parse(
        container.querySelector('[name="content"]')?.getAttribute('value') ?? '',
      ) as JSONContent;
      expect(document.content).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ type: 'image' })]),
      );
    });
  });
});
