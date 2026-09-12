'use client';

import { EditorContent, type JSONContent, useEditor } from '@tiptap/react';
import { useEffect, useState } from 'react';

import { uploadArticleImage } from '../services/admin-media.service';
import type { UploadArticleImage, UploadedArticleImage } from '../types/admin-media.types';
import { ArticleImageForm } from './article-image-form';
import { ArticleEditorContextMenus, ArticleEditorToolbar } from './article-editor-toolbar';
import {
  ARTICLE_CONTENT_SCHEMA_VERSION,
  createArticleEditorExtensions,
  EMPTY_ARTICLE_DOCUMENT,
} from './article-editor.config';
import { ArticleLinkForm } from './article-link-form';

interface ArticleEditorProps {
  editable?: boolean;
  initialContent?: JSONContent;
  onChange?: (content: JSONContent, schemaVersion: number) => void;
  uploadImage?: UploadArticleImage;
}

export function ArticleEditor({
  editable = true,
  initialContent = EMPTY_ARTICLE_DOCUMENT,
  onChange,
  uploadImage = uploadArticleImage,
}: Readonly<ArticleEditorProps>) {
  const [content, setContent] = useState<JSONContent>(initialContent);
  const [isImageFormOpen, setIsImageFormOpen] = useState(false);
  const [isLinkFormOpen, setIsLinkFormOpen] = useState(false);
  const editor = useEditor({
    content: initialContent,
    editable,
    editorProps: {
      attributes: {
        'aria-label': 'Conteúdo do artigo',
        'aria-multiline': 'true',
        class: 'article-editor-content article-prose',
        role: 'textbox',
      },
      handleKeyDown: (_view, event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
          event.preventDefault();
          setIsImageFormOpen(false);
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

  useEffect(() => {
    if (editor && editor.isEditable !== editable) editor.setEditable(editable);
  }, [editable, editor]);

  function openImageForm() {
    setIsLinkFormOpen(false);
    setIsImageFormOpen(true);
  }

  function openLinkForm() {
    setIsImageFormOpen(false);
    setIsLinkFormOpen(true);
  }

  function insertUploadedImage(image: UploadedArticleImage) {
    editor
      ?.chain()
      .focus()
      .setImage({
        alt: image.altText,
        ...(image.height ? { height: image.height } : {}),
        src: image.url,
        ...(image.width ? { width: image.width } : {}),
      })
      .run();
    setIsImageFormOpen(false);
  }

  return (
    <section aria-label="Editor do artigo" className="article-editor-shell">
      {editor && editable ? (
        <>
          <div className="article-editor-toolbar-region">
            <ArticleEditorToolbar
              editor={editor}
              onAddImage={openImageForm}
              onEditLink={openLinkForm}
            />
            {isImageFormOpen || isLinkFormOpen ? (
              <div className="article-editor-toolbar-panel">
                {isImageFormOpen ? (
                  <ArticleImageForm
                    onClose={() => setIsImageFormOpen(false)}
                    onUploaded={insertUploadedImage}
                    uploadImage={uploadImage}
                  />
                ) : null}
                {isLinkFormOpen ? (
                  <ArticleLinkForm editor={editor} onClose={() => setIsLinkFormOpen(false)} />
                ) : null}
              </div>
            ) : null}
          </div>
        </>
      ) : null}
      <div className="relative">
        <EditorContent editor={editor} />
        {editor && editable ? (
          <ArticleEditorContextMenus
            editor={editor}
            onAddImage={openImageForm}
            onEditLink={openLinkForm}
          />
        ) : null}
      </div>
      <input name="content" readOnly type="hidden" value={JSON.stringify(content)} />
      <input
        name="contentSchemaVersion"
        readOnly
        type="hidden"
        value={ARTICLE_CONTENT_SCHEMA_VERSION}
      />
      <p className="text-neutral-400 border-divider border-t px-5 py-3 font-mono text-[11px]">
        Conteúdo estruturado · versão {ARTICLE_CONTENT_SCHEMA_VERSION}
      </p>
    </section>
  );
}
