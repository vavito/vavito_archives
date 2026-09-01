'use client';

import { Check, Share2 } from 'lucide-react';
import { useState } from 'react';

interface ArticleShareButtonProps {
  title: string;
}

export function ArticleShareButton({ title }: Readonly<ArticleShareButtonProps>) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  async function share() {
    const shareData = { title, url: window.location.href };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(shareData.url);
      setCopied(true);
      setFailed(false);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setFailed(true);
      window.setTimeout(() => setFailed(false), 2000);
    }
  }

  return (
    <button
      aria-live="polite"
      className="text-neutral-300 hover:border-border-hover hover:text-neutral-100 inline-flex min-h-9 items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-medium transition-colors"
      onClick={() => void share()}
      type="button"
    >
      {copied ? (
        <Check aria-hidden="true" className="text-accent size-4" />
      ) : (
        <Share2 aria-hidden="true" className="size-4" />
      )}
      {failed ? 'Não foi possível copiar' : copied ? 'Link copiado' : 'Compartilhar'}
    </button>
  );
}
