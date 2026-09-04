import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { JSONContent } from '@tiptap/react';

import { ArticleEditor } from '@web/features/admin/editor/article-editor';
import {
  ARTICLE_CONTENT_SCHEMA_VERSION,
  createArticleEditorExtensions,
} from '@web/features/admin/editor/article-editor.config';

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
});
