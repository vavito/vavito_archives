'use client';

import { EditorContent, type JSONContent, useEditor } from '@tiptap/react';
import { useState } from 'react';

import { ArticleEditorContextMenus, ArticleEditorToolbar } from './article-editor-toolbar';
import {
  ARTICLE_CONTENT_SCHEMA_VERSION,
  createArticleEditorExtensions,
  EMPTY_ARTICLE_DOCUMENT,
} from './article-editor.config';
import { ArticleLinkForm } from './article-link-form';

interface ArticleEditorProps {
  initialContent?: JSONContent;
  onChange?: (content: JSONContent, schemaVersion: number) => void;
}

export function ArticleEditor({
  initialContent = EMPTY_ARTICLE_DOCUMENT,
  onChange,
}: Readonly<ArticleEditorProps>) {
  const [content, setContent] = useState<JSONContent>(initialContent);
  const [isLinkFormOpen, setIsLinkFormOpen] = useState(false);
  const editor = useEditor({
    content: initialContent,
    editorProps: {
      attributes: {
        'aria-label': 'Conteúdo do artigo',
        class: 'article-editor-content article-prose',
      },
      handleKeyDown: (_view, event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
          event.preventDefault();
          setIsLinkFormOpen(true);
          return true;
        }

        return false;
      },
    },
    extensions: createArticleEditorExtensions(),
    immediatelyRender: false,
    onUpdate: ({ editor: currentEditor }) => {
      const nextContent = currentEditor.getJSON();
      setContent(nextContent);
      onChange?.(nextContent, ARTICLE_CONTENT_SCHEMA_VERSION);
    },
  });

  return (
    <section aria-label="Editor do artigo" className="article-editor-shell">
      {editor ? (
        <div className="article-editor-toolbar-region">
          <ArticleEditorToolbar editor={editor} onEditLink={() => setIsLinkFormOpen(true)} />
          {isLinkFormOpen ? (
            <ArticleLinkForm editor={editor} onClose={() => setIsLinkFormOpen(false)} />
          ) : null}
        </div>
      ) : null}
      <div className="relative">
        <EditorContent editor={editor} />
        {editor ? (
          <ArticleEditorContextMenus editor={editor} onEditLink={() => setIsLinkFormOpen(true)} />
        ) : null}
      </div>
      <input name="content" readOnly type="hidden" value={JSON.stringify(content)} />
      <input
        name="contentSchemaVersion"
        readOnly
        type="hidden"
        value={ARTICLE_CONTENT_SCHEMA_VERSION}
      />
      <p className="text-neutral-600 border-divider border-t px-5 py-3 font-mono text-[11px]">
        Conteúdo estruturado · versão {ARTICLE_CONTENT_SCHEMA_VERSION}
      </p>
    </section>
  );
}
