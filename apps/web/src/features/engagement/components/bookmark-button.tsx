'use client';

import { Chip } from '@vavito/ui';
import { Bookmark } from 'lucide-react';
import { useCallback, useRef, useState, useTransition } from 'react';

import {
  ActionFeedback,
  type ActionFeedbackMessage,
} from '@web/components/feedback/action-feedback';
import { AuthRequiredDialog } from '@web/components/feedback/auth-required-dialog';
import { LoadingSpinner } from '@web/components/feedback/loading-spinner';

import { SafeBookmarkActionError, saveBookmark } from '../services/bookmarks.service';

interface BookmarkButtonProps {
  initialBookmarked: boolean;
  isAuthenticated: boolean;
  postId: string;
  slug: string;
  inLibrary?: boolean;
}

export function BookmarkButton({
  initialBookmarked,
  isAuthenticated,
  postId,
  slug,
  inLibrary = false,
}: Readonly<BookmarkButtonProps>) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState<ActionFeedbackMessage | null>(null);
  const [pending, startTransition] = useTransition();
  const inFlight = useRef(false);
  const dismissFeedback = useCallback(() => setFeedback(null), []);

  function toggle() {
    if (!isAuthenticated) {
      setAuthDialogOpen(true);
      return;
    }
    if (inFlight.current) return;
    inFlight.current = true;
    const previous = bookmarked;
    setBookmarked(!previous);
    startTransition(async () => {
      try {
        setBookmarked(await saveBookmark(slug, postId, !previous));
      } catch (error) {
        setBookmarked(previous);
        setFeedback({
          id: Date.now(),
          message:
            error instanceof SafeBookmarkActionError
              ? error.message
              : 'Não foi possível atualizar seus artigos salvos agora. Tente novamente.',
          tone: 'error',
        });
      } finally {
        inFlight.current = false;
      }
    });
  }

  return (
    <>
      {feedback ? (
        <ActionFeedback key={feedback.id} feedback={feedback} onDismiss={dismissFeedback} />
      ) : null}
      <Chip
        active={bookmarked}
        aria-busy={pending}
        aria-label={bookmarked ? 'Remover dos salvos' : 'Salvar artigo'}
        disabled={pending}
        onClick={toggle}
      >
        {pending ? (
          <LoadingSpinner />
        ) : (
          <Bookmark aria-hidden="true" fill={bookmarked ? 'currentColor' : 'none'} />
        )}
        {pending
          ? 'Atualizando…'
          : bookmarked
            ? inLibrary
              ? 'Remover dos salvos'
              : 'Salvo'
            : 'Salvar'}
      </Chip>
      <AuthRequiredDialog
        articlePath={`/artigos/${slug}`}
        description="Entre na sua conta para guardar este artigo e ler depois. Seus artigos salvos ficam disponíveis só para você."
        onOpenChange={setAuthDialogOpen}
        open={authDialogOpen}
      />
    </>
  );
}
