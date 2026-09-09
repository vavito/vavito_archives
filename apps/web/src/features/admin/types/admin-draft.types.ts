import type { JSONContent } from '@tiptap/react';

export type AdminDraftPhase = 'dirty' | 'error' | 'idle' | 'loading' | 'saved' | 'saving';

export interface AdminDraftDocument {
  content: JSONContent;
  contentSchemaVersion: number;
  coverAlt: string | null;
  coverMediaId: string | null;
  coverPositionX?: number;
  coverPositionY?: number;
  coverScale?: number;
  coverUrl: string | null;
  excerpt: string;
  slug: string;
  tagNames: string[];
  title: string;
}

export interface AdminPostDraft extends AdminDraftDocument {
  hasPendingChanges: boolean;
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
  hasPendingChanges: boolean;
  postId: string | null;
  postStatus: AdminPostDraft['status'] | null;
  retry: () => void;
  reload: () => void;
  saveNow: () => void;
  setContent: (content: JSONContent, contentSchemaVersion: number) => void;
  setCover: (cover: AdminDraftCover | null) => void;
  setExcerpt: (excerpt: string) => void;
  setSlug: (slug: string) => void;
  setTagNames: (tagNames: string[]) => void;
  setPostStatus: (status: AdminPostDraft['status']) => void;
  setHasPendingChanges: (value: boolean) => void;
  setTitle: (title: string) => void;
}

export interface AdminDraftCover {
  altText: string;
  mediaId: string;
  positionX?: number;
  positionY?: number;
  scale?: number;
  url: string;
}
