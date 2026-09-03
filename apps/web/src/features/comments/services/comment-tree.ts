import type { CommentItem } from '../types/comments.types';

export function addComment(
  threads: CommentItem[],
  comment: CommentItem,
  parentId: string | null,
): CommentItem[] {
  if (!parentId) return [...threads, comment];

  return threads.map((thread) =>
    thread.id === parentId ? { ...thread, replies: [...thread.replies, comment] } : thread,
  );
}

export function replaceComment(
  threads: CommentItem[],
  id: string,
  replacement: CommentItem,
): CommentItem[] {
  return threads.map((thread) => {
    if (thread.id === id) {
      return { ...replacement, replies: thread.replies };
    }

    return {
      ...thread,
      replies: thread.replies.map((reply) => (reply.id === id ? replacement : reply)),
    };
  });
}

export function removeCommentOptimistically(threads: CommentItem[], id: string): CommentItem[] {
  return threads
    .map((thread) => {
      if (thread.id === id) {
        if (thread.replies.length === 0) return null;

        return {
          ...thread,
          author: null,
          content: null,
          edited: false,
          editedAt: null,
          status: 'DELETED' as const,
        };
      }

      return {
        ...thread,
        replies: thread.replies.filter((reply) => reply.id !== id),
      };
    })
    .filter((thread): thread is CommentItem => thread !== null);
}

export function findComment(threads: CommentItem[], id: string): CommentItem | null {
  for (const thread of threads) {
    if (thread.id === id) return thread;
    const reply = thread.replies.find((candidate) => candidate.id === id);
    if (reply) return reply;
  }

  return null;
}
