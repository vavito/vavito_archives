'use client';

import { Chip } from '@vavito/ui';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { useCallback, useState } from 'react';

import {
  ActionFeedback,
  type ActionFeedbackMessage,
} from '@web/components/feedback/action-feedback';
import { AuthRequiredDialog } from '@web/components/feedback/auth-required-dialog';
import { LoadingSpinner } from '@web/components/feedback/loading-spinner';

import { SafeReactionActionError, saveReaction } from '../services/reactions.service';
import type { ReactionCounts, ReactionState, ReactionType } from '../types/reactions.types';

interface ArticleReactionsProps {
  initialCounts: ReactionCounts;
  initialReaction: ReactionType | null;
  isAuthenticated: boolean;
  postId: string;
  slug: string;
}

function optimisticState(state: ReactionState, selected: ReactionType): ReactionState {
  const counts = { ...state.counts };

  if (state.reaction === selected) {
    counts[selected === 'LIKE' ? 'like' : 'dislike'] = Math.max(
      0,
      counts[selected === 'LIKE' ? 'like' : 'dislike'] - 1,
    );
    return { counts, reaction: null };
  }

  if (state.reaction) {
    const previousKey = state.reaction === 'LIKE' ? 'like' : 'dislike';
    counts[previousKey] = Math.max(0, counts[previousKey] - 1);
  }

  const selectedKey = selected === 'LIKE' ? 'like' : 'dislike';
  counts[selectedKey] += 1;
  return { counts, reaction: selected };
}

function friendlyError(error: unknown): string {
  return error instanceof SafeReactionActionError
    ? error.message
    : 'Não foi possível atualizar sua reação agora.';
}

export function ArticleReactions({
  initialCounts,
  initialReaction,
  isAuthenticated,
  postId,
  slug,
}: Readonly<ArticleReactionsProps>) {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState<ActionFeedbackMessage | null>(null);
  const [pendingReaction, setPendingReaction] = useState<ReactionType | null>(null);
  const [state, setState] = useState<ReactionState>({
    counts: initialCounts,
    reaction: initialReaction,
  });
  const dismissFeedback = useCallback(() => setFeedback(null), []);

  async function react(type: ReactionType) {
    if (!isAuthenticated) {
      setAuthDialogOpen(true);
      return;
    }

    const previous = state;
    const optimistic = optimisticState(previous, type);
    setState(optimistic);
    setPendingReaction(type);

    try {
      const confirmed = await saveReaction(slug, postId, previous.reaction, type);
      setState(confirmed ?? optimistic);
    } catch (error) {
      setState(previous);
      setFeedback({ id: Date.now(), message: friendlyError(error), tone: 'error' });
    } finally {
      setPendingReaction(null);
    }
  }

  return (
    <>
      {feedback ? <ActionFeedback feedback={feedback} onDismiss={dismissFeedback} /> : null}
      <div
        aria-label="Reações ao artigo"
        className="flex flex-wrap items-center gap-2"
        role="group"
      >
        <Chip
          active={state.reaction === 'LIKE'}
          aria-label={`Gostei, ${state.counts.like.toLocaleString('pt-BR')}`}
          disabled={pendingReaction !== null}
          onClick={() => void react('LIKE')}
        >
          {pendingReaction === 'LIKE' ? <LoadingSpinner /> : <ThumbsUp />}
          Gostei
          <span aria-hidden="true">{state.counts.like.toLocaleString('pt-BR')}</span>
        </Chip>
        <Chip
          active={state.reaction === 'DISLIKE'}
          aria-label={`Não gostei, ${state.counts.dislike.toLocaleString('pt-BR')}`}
          disabled={pendingReaction !== null}
          onClick={() => void react('DISLIKE')}
        >
          {pendingReaction === 'DISLIKE' ? <LoadingSpinner /> : <ThumbsDown />}
          Não gostei
          <span aria-hidden="true">{state.counts.dislike.toLocaleString('pt-BR')}</span>
        </Chip>
      </div>

      <AuthRequiredDialog
        articlePath={`/artigos/${slug}`}
        description="Para reagir a este artigo, entre na sua conta ou crie uma gratuitamente. Depois você voltará para esta página."
        onOpenChange={setAuthDialogOpen}
        open={authDialogOpen}
      />
    </>
  );
}
