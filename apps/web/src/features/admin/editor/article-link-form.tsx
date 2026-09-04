'use client';

import { Button } from '@vavito/ui';
import type { Editor } from '@tiptap/react';
import { Check, Unlink2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface ArticleLinkFormProps {
  editor: Editor;
  onClose: () => void;
}

export function normalizeArticleLinkHref(value: string): string {
  const href = value.trim();

  if (/^(https?:|mailto:|tel:)/i.test(href)) {
    return href;
  }

  return `https://${href.replace(/^\/\//, '')}`;
}

export function ArticleLinkForm({ editor, onClose }: Readonly<ArticleLinkFormProps>) {
  const linkAttributes = editor.getAttributes('link') as Record<string, unknown>;
  const [href, setHref] = useState(() =>
    typeof linkAttributes.href === 'string' ? linkAttributes.href : '',
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const hasActiveLink = editor.isActive('link');

  useEffect(() => {
    const animationFrame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, []);

  function submitLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!href.trim()) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      onClose();
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: normalizeArticleLinkHref(href) })
      .run();
    onClose();
  }

  function removeLink() {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    onClose();
  }

  return (
    <form
      aria-label="Editar link"
      className="border-divider flex flex-wrap items-end gap-2 border-t px-3 py-3 sm:px-4"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          onClose();
          editor.commands.focus();
        }
      }}
      onSubmit={submitLink}
      role="dialog"
    >
      <label className="grid min-w-52 flex-1 gap-1.5">
        <span className="text-neutral-500 font-mono text-[10px] tracking-[0.14em] uppercase">
          Endereço do link
        </span>
        <input
          ref={inputRef}
          aria-label="Endereço do link"
          className="bg-surface-raised min-h-10 rounded-lg border border-border px-3 text-sm text-neutral-100 outline-none transition-colors placeholder:text-neutral-600 focus:border-accent"
          inputMode="url"
          onChange={(event) => setHref(event.target.value)}
          placeholder="exemplo.com/artigo"
          type="text"
          value={href}
        />
      </label>
      <Button aria-label="Aplicar link" size="icon" title="Aplicar link" type="submit">
        <Check aria-hidden="true" />
      </Button>
      {hasActiveLink ? (
        <Button
          aria-label="Remover link"
          onClick={removeLink}
          size="icon"
          title="Remover link"
          variant="secondary"
        >
          <Unlink2 aria-hidden="true" />
        </Button>
      ) : null}
      <Button
        aria-label="Fechar editor de link"
        onClick={() => {
          onClose();
          editor.commands.focus();
        }}
        size="icon"
        title="Fechar"
        variant="ghost"
      >
        <X aria-hidden="true" />
      </Button>
    </form>
  );
}
