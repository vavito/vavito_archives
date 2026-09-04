import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import type { Extensions, JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

export const ARTICLE_CONTENT_SCHEMA_VERSION = 1;

export const EMPTY_ARTICLE_DOCUMENT: JSONContent = {
  content: [{ type: 'paragraph' }],
  type: 'doc',
};

export function createArticleEditorExtensions(): Extensions {
  return [
    StarterKit.configure({
      heading: { levels: [2, 3] },
      link: {
        autolink: true,
        defaultProtocol: 'https',
        openOnClick: false,
      },
    }),
    Image.configure({
      allowBase64: false,
      inline: false,
    }),
    Placeholder.configure({
      placeholder: 'Comece a escrever seu artigo…',
    }),
  ];
}
