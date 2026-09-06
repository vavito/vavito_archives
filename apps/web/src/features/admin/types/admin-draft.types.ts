import type { JSONContent } from '@tiptap/react';

export type AdminDraftPhase = 'dirty' | 'error' | 'idle' | 'loading' | 'saved' | 'saving';

export interface AdminDraftDocument {
  content: JSONContent;
  contentSchemaVersion: number;
  excerpt: string;
  slug: string;
  title: string;
}

export interface AdminPostDraft extends AdminDraftDocument {
  id: string;
  status: 'ARCHIVED' | 'DRAFT' | 'PUBLISHED';
  updatedAt: string;
}

export interface AdminDraftGateway {
  create: (title: string) => Promise<AdminPostDraft>;
  get: (id: string) => Promise<AdminPostDraft>;
  update: (id: string, draft: AdminDraftDocument) => Promise<AdminPostDraft>;
}

export interface AdminDraftState {
  draft: AdminDraftDocument;
  errorCode: string | null;
  errorMessage: string | null;
  isReady: boolean;
  phase: AdminDraftPhase;
  postId: string | null;
  postStatus: AdminPostDraft['status'] | null;
  retry: () => void;
  saveNow: () => void;
  setContent: (content: JSONContent, contentSchemaVersion: number) => void;
  setExcerpt: (excerpt: string) => void;
  setSlug: (slug: string) => void;
  setPostStatus: (status: AdminPostDraft['status']) => void;
  setTitle: (title: string) => void;
}
