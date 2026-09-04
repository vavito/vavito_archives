'use client';

import { Check, Share2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { copyToClipboard } from '@web/lib/browser/copy-to-clipboard';

export function ArticleShareButton() {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    [],
  );

  async function share() {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    try {
      await copyToClipboard(window.location.href);
      setCopied(true);
      setFailed(false);
    } catch {
      setCopied(false);
      setFailed(true);
    }
    resetTimer.current = setTimeout(() => {
      setCopied(false);
      setFailed(false);
    }, 2000);
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
