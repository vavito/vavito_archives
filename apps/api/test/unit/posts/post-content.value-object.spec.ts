import { PostContentInvalidError } from '@api/modules/posts/domain/errors/post-content-invalid.error';
import {
  CURRENT_POST_CONTENT_SCHEMA_VERSION,
  PostContent,
} from '@api/modules/posts/domain/value-objects/post-content.value-object';

const DOCUMENT = {
  content: [{ content: [{ text: 'Conteúdo', type: 'text' }], type: 'paragraph' }],
  type: 'doc',
};

describe('PostContent', () => {
  it('aceita o JSON produzido pelo schema editorial da versão atual', () => {
    const editorDocument = {
      content: [
        {
          attrs: { level: 2 },
          content: [{ text: 'Título de seção', type: 'text' }],
          type: 'heading',
        },
        {
          content: [
            {
              marks: [
                { type: 'bold' },
                { attrs: { href: 'https://vavitoarchives.com.br' }, type: 'link' },
              ],
              text: 'Texto formatado',
              type: 'text',
            },
          ],
          type: 'paragraph',
        },
        {
          attrs: { alt: 'Descrição da imagem', src: 'https://storage.test/media/image.webp' },
          type: 'image',
        },
        {
          content: [{ content: [{ text: 'Citação', type: 'text' }], type: 'paragraph' }],
          type: 'blockquote',
        },
        {
          content: [{ text: 'const ready = true;', type: 'text' }],
          type: 'codeBlock',
        },
        {
          content: [
            {
              content: [
                {
                  content: [{ text: 'Primeiro item', type: 'text' }],
                  type: 'paragraph',
                },
              ],
              type: 'listItem',
            },
          ],
          type: 'bulletList',
        },
      ],
      type: 'doc',
    };

    const content = PostContent.create(editorDocument, CURRENT_POST_CONTENT_SCHEMA_VERSION);

    expect(content.document).toEqual(editorDocument);
    expect(content.isEmpty).toBe(false);
  });

  it('cria conteúdo Tiptap com a versão suportada', () => {
    const content = PostContent.create(DOCUMENT, CURRENT_POST_CONTENT_SCHEMA_VERSION);

    expect(content.document).toEqual(DOCUMENT);
    expect(content.schemaVersion).toBe(CURRENT_POST_CONTENT_SCHEMA_VERSION);
    expect(content.isEmpty).toBe(false);
  });

  it.each([
    { content: [], type: 'doc' },
    { content: [{ type: 'paragraph' }], type: 'doc' },
    {
      content: [{ content: [{ text: '   ', type: 'text' }], type: 'paragraph' }],
      type: 'doc',
    },
  ])('identifica documento semanticamente vazio', (document) => {
    expect(PostContent.create(document, 1).isEmpty).toBe(true);
  });

  it('considera mídia como conteúdo mesmo sem texto', () => {
    const content = PostContent.create(
      { content: [{ attrs: { src: '/imagem.webp' }, type: 'image' }], type: 'doc' },
      1,
    );

    expect(content.isEmpty).toBe(false);
  });

  it.each([
    null,
    {},
    { content: [], type: 'paragraph' },
    { content: 'inválido', type: 'doc' },
    { content: [{ type: '' }], type: 'doc' },
    { content: [{ text: 1, type: 'text' }], type: 'doc' },
  ])('rejeita estrutura Tiptap inválida', (document) => {
    expect(() => PostContent.create(document, 1)).toThrow(PostContentInvalidError);
  });

  it.each([0, -1, 1.5, 2])('rejeita schemaVersion não suportada: %s', (schemaVersion) => {
    expect(() => PostContent.create(DOCUMENT, schemaVersion)).toThrow(PostContentInvalidError);
  });

  it('rejeita valores que não podem ser persistidos como JSONB', () => {
    expect(() =>
      PostContent.create(
        { content: [{ attrs: { createdAt: new Date() }, type: 'image' }], type: 'doc' },
        1,
      ),
    ).toThrow(PostContentInvalidError);
  });

  it('protege o documento contra mutação externa', () => {
    const document = structuredClone(DOCUMENT);
    const content = PostContent.create(document, 1);

    document.content[0]!.type = 'heading';
    const returnedDocument = content.document;
    (returnedDocument.content[0] as { type: string }).type = 'blockquote';

    expect(content.document).toEqual(DOCUMENT);
  });
});
