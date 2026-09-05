'use client';

import { ApiClientError } from '@vavito/api-client';
import type { JSONContent } from '@tiptap/react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  ARTICLE_CONTENT_SCHEMA_VERSION,
  EMPTY_ARTICLE_DOCUMENT,
} from '../editor/article-editor.config';
import {
  clearActiveAdminDraftId,
  readActiveAdminDraftId,
  writeActiveAdminDraftId,
  type DraftStorage,
} from '../services/admin-draft-storage.service';
import { adminDraftGateway } from '../services/admin-posts.service';
import type {
  AdminDraftDocument,
  AdminDraftGateway,
  AdminDraftState,
} from '../types/admin-draft.types';

export const ADMIN_DRAFT_AUTOSAVE_DELAY_MS = 800;

interface AdminDraftProviderProps {
  children: ReactNode;
  debounceMs?: number;
  gateway?: AdminDraftGateway;
  storage?: DraftStorage;
}

type FailureKind = 'load' | 'save' | null;

const AdminDraftContext = createContext<AdminDraftState | null>(null);

function createEmptyDraft(): AdminDraftDocument {
  return {
    content: EMPTY_ARTICLE_DOCUMENT,
    contentSchemaVersion: ARTICLE_CONTENT_SCHEMA_VERSION,
    title: '',
  };
}

function safeDraftError(error: unknown, fallback: string): string {
  return error instanceof ApiClientError ? error.message : fallback;
}

export function AdminDraftProvider({
  children,
  debounceMs = ADMIN_DRAFT_AUTOSAVE_DELAY_MS,
  gateway = adminDraftGateway,
  storage,
}: Readonly<AdminDraftProviderProps>) {
  const [draft, setDraft] = useState<AdminDraftDocument>(createEmptyDraft);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [phase, setPhase] = useState<AdminDraftState['phase']>('loading');
  const [postId, setPostId] = useState<string | null>(null);
  const failureKindRef = useRef<FailureKind>(null);
  const flushRef = useRef<() => Promise<void>>(() => Promise.resolve());
  const inFlightRef = useRef(false);
  const isHydratedRef = useRef(false);
  const latestDraftRef = useRef(draft);
  const mountedRef = useRef(false);
  const postIdRef = useRef<string | null>(null);
  const recoveryAttemptRef = useRef(0);
  const revisionRef = useRef(0);
  const savedRevisionRef = useRef(0);
  const saveQueuedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hydrateEmptyDraft = useCallback(() => {
    const emptyDraft = createEmptyDraft();
    latestDraftRef.current = emptyDraft;
    postIdRef.current = null;
    revisionRef.current = 0;
    savedRevisionRef.current = 0;
    failureKindRef.current = null;
    isHydratedRef.current = true;
    setDraft(emptyDraft);
    setErrorMessage(null);
    setPostId(null);
    setIsReady(true);
    setPhase('idle');
  }, []);

  const recoverDraft = useCallback(async () => {
    const recoveryAttempt = ++recoveryAttemptRef.current;
    const storedPostId = readActiveAdminDraftId(storage);
    isHydratedRef.current = false;
    failureKindRef.current = null;
    setErrorMessage(null);
    setIsReady(false);
    setPhase('loading');

    if (!storedPostId) {
      if (mountedRef.current && recoveryAttempt === recoveryAttemptRef.current) {
        hydrateEmptyDraft();
      }
      return;
    }

    try {
      const recoveredDraft = await gateway.get(storedPostId);

      if (!mountedRef.current || recoveryAttempt !== recoveryAttemptRef.current) {
        return;
      }

      const nextDraft: AdminDraftDocument = {
        content: recoveredDraft.content,
        contentSchemaVersion: recoveredDraft.contentSchemaVersion,
        title: recoveredDraft.title,
      };
      latestDraftRef.current = nextDraft;
      postIdRef.current = recoveredDraft.id;
      revisionRef.current = 0;
      savedRevisionRef.current = 0;
      failureKindRef.current = null;
      isHydratedRef.current = true;
      setDraft(nextDraft);
      setPostId(recoveredDraft.id);
      setIsReady(true);
      setPhase('saved');
    } catch (error) {
      if (!mountedRef.current || recoveryAttempt !== recoveryAttemptRef.current) {
        return;
      }

      if (error instanceof ApiClientError && error.statusCode === 404) {
        clearActiveAdminDraftId(storage);
        hydrateEmptyDraft();
        return;
      }

      failureKindRef.current = 'load';
      setErrorMessage(
        safeDraftError(error, 'Não foi possível recuperar seu rascunho agora. Tente novamente.'),
      );
      setPhase('error');
    }
  }, [gateway, hydrateEmptyDraft, storage]);

  const flushLatestDraft = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!isHydratedRef.current) {
      return;
    }

    if (inFlightRef.current) {
      saveQueuedRef.current = true;
      return;
    }

    const targetRevision = revisionRef.current;

    if (targetRevision <= savedRevisionRef.current) {
      return;
    }

    const snapshot = latestDraftRef.current;
    inFlightRef.current = true;
    saveQueuedRef.current = false;
    failureKindRef.current = null;
    setErrorMessage(null);
    setPhase('saving');

    try {
      let activePostId = postIdRef.current;

      if (!activePostId) {
        const createdDraft = await gateway.create(snapshot.title);
        activePostId = createdDraft.id;
        postIdRef.current = activePostId;
        writeActiveAdminDraftId(activePostId, storage);

        if (mountedRef.current) {
          setPostId(activePostId);
        }
      }

      await gateway.update(activePostId, snapshot);
      savedRevisionRef.current = Math.max(savedRevisionRef.current, targetRevision);
      inFlightRef.current = false;

      if (!mountedRef.current) {
        return;
      }

      if (saveQueuedRef.current) {
        saveQueuedRef.current = false;
        void flushRef.current();
        return;
      }

      if (revisionRef.current > targetRevision) {
        setPhase('dirty');
        return;
      }

      setPhase('saved');
    } catch (error) {
      inFlightRef.current = false;
      saveQueuedRef.current = false;

      if (!mountedRef.current) {
        return;
      }

      failureKindRef.current = 'save';
      setErrorMessage(
        safeDraftError(error, 'Não foi possível salvar seu rascunho agora. Tente novamente.'),
      );
      setPhase('error');
    }
  }, [gateway, storage]);

  useEffect(() => {
    flushRef.current = flushLatestDraft;
  }, [flushLatestDraft]);

  useEffect(() => {
    mountedRef.current = true;
    queueMicrotask(() => void recoverDraft());

    return () => {
      mountedRef.current = false;
      recoveryAttemptRef.current += 1;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [recoverDraft]);

  const queueAutosave = useCallback(() => {
    revisionRef.current += 1;
    failureKindRef.current = null;
    setErrorMessage(null);
    setPhase('dirty');

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      void flushRef.current();
    }, debounceMs);
  }, [debounceMs]);

  const setTitle = useCallback(
    (title: string) => {
      const nextDraft = { ...latestDraftRef.current, title };
      latestDraftRef.current = nextDraft;
      setDraft(nextDraft);
      queueAutosave();
    },
    [queueAutosave],
  );

  const setContent = useCallback(
    (content: JSONContent, contentSchemaVersion: number) => {
      const nextDraft = { ...latestDraftRef.current, content, contentSchemaVersion };
      latestDraftRef.current = nextDraft;
      setDraft(nextDraft);
      queueAutosave();
    },
    [queueAutosave],
  );

  const saveNow = useCallback(() => {
    void flushRef.current();
  }, []);

  const retry = useCallback(() => {
    if (failureKindRef.current === 'load') {
      void recoverDraft();
      return;
    }

    void flushRef.current();
  }, [recoverDraft]);

  const value = useMemo<AdminDraftState>(
    () => ({
      draft,
      errorMessage,
      isReady,
      phase,
      postId,
      retry,
      saveNow,
      setContent,
      setTitle,
    }),
    [draft, errorMessage, isReady, phase, postId, retry, saveNow, setContent, setTitle],
  );

  return <AdminDraftContext.Provider value={value}>{children}</AdminDraftContext.Provider>;
}

export function useAdminDraft(): AdminDraftState {
  const context = useContext(AdminDraftContext);

  if (!context) {
    throw new Error('useAdminDraft deve ser usado dentro de AdminDraftProvider.');
  }

  return context;
}
