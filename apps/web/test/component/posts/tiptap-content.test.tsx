import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TiptapContent } from '@web/features/posts/components/tiptap-content';

describe('TiptapContent', () => {
  it('renderiza texto rico, listas, código e imagem do documento editorial', () => {
    const { container } = render(
      <TiptapContent
        content={{
          content: [
            {
              attrs: { level: 2 },
              content: [{ text: 'Arquitetura', type: 'text' }],
              type: 'heading',
            },
            {
              content: [
                { marks: [{ type: 'bold' }], text: 'NestJS', type: 'text' },
                { text: ' em produção.', type: 'text' },
              ],
              type: 'paragraph',
            },
            {
              content: [
                {
                  content: [{ content: [{ text: 'Módulos', type: 'text' }], type: 'paragraph' }],
                  type: 'listItem',
                },
              ],
              type: 'bulletList',
            },
            {
              attrs: { language: 'typescript' },
              content: [{ text: 'const app = true;', type: 'text' }],
              type: 'codeBlock',
            },
            {
              attrs: {
                alt: 'Diagrama dos módulos',
                src: 'https://storage.test/media/diagrama.webp',
                title: 'Módulos da aplicação',
              },
              type: 'image',
            },
          ],
          type: 'doc',
        }}
      />,
    );

    expect(screen.getByRole('heading', { level: 2, name: 'Arquitetura' })).toBeInTheDocument();
    expect(screen.getByText('NestJS')).toHaveProperty('tagName', 'STRONG');
    expect(screen.getByRole('list')).toHaveTextContent('Módulos');
    expect(container.querySelector('pre')).toHaveTextContent('const app = true;');
    expect(screen.getByRole('img', { name: 'Diagrama dos módulos' })).toHaveAttribute(
      'src',
      'https://storage.test/media/diagrama.webp',
    );
    expect(screen.getByText('Módulos da aplicação')).toBeInTheDocument();
  });

  it('descarta URLs inseguras e orienta quando o documento está vazio', () => {
    const { container, rerender } = render(
      <TiptapContent
        content={{
          content: [{ attrs: { src: 'javascript:alert(1)' }, type: 'image' }],
          type: 'doc',
        }}
      />,
    );

    expect(container.querySelector('img')).not.toBeInTheDocument();

    rerender(<TiptapContent content={{ content: [], type: 'doc' }} />);
    expect(
      screen.getByText('Este artigo ainda não possui conteúdo disponível.'),
    ).toBeInTheDocument();
  });
});
