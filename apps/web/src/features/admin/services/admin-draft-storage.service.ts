'use client';

import 'client-only';

const ACTIVE_ADMIN_DRAFT_KEY = 'vavito:admin:active-draft-id';

export type DraftStorage = Pick<Storage, 'getItem' | 'removeItem' | 'setItem'>;

export function readActiveAdminDraftId(storage?: DraftStorage): string | null {
  try {
    return (storage ?? globalThis.localStorage).getItem(ACTIVE_ADMIN_DRAFT_KEY)?.trim() || null;
  } catch {
    return null;
  }
}

export function writeActiveAdminDraftId(id: string, storage?: DraftStorage): void {
  try {
    (storage ?? globalThis.localStorage).setItem(ACTIVE_ADMIN_DRAFT_KEY, id);
  } catch {
    // O autosave continua funcional mesmo quando o navegador bloqueia o armazenamento local.
  }
}

export function clearActiveAdminDraftId(storage?: DraftStorage): void {
  try {
    (storage ?? globalThis.localStorage).removeItem(ACTIVE_ADMIN_DRAFT_KEY);
  } catch {
    // Não há estado local obrigatório para remover.
  }
}
