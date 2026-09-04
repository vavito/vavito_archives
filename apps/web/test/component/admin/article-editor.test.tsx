import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { JSONContent } from '@tiptap/react';

import { ArticleEditor } from '@web/features/admin/editor/article-editor';
import {
  ARTICLE_CONTENT_SCHEMA_VERSION,
  createArticleEditorExtensions,
} from '@web/features/admin/editor/article-editor.config';
import { normalizeArticleLinkHref } from '@web/features/admin/editor/article-link-form';

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

  it('oferece as formatações previstas e informa seus atalhos', async () => {
    render(<ArticleEditor />);

    const toolbar = await screen.findByRole('toolbar', { name: 'Ferramentas de formatação' });
    const toolbarQueries = within(toolbar);

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
    expect(toolbarQueries.getByRole('button', { name: 'Código em linha' })).toBeInTheDocument();
    expect(toolbarQueries.getByRole('button', { name: 'Bloco de código' })).toBeInTheDocument();
    expect(toolbarQueries.getByRole('button', { name: 'Citação' })).toBeInTheDocument();
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
});
