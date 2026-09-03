import type { ApiClient } from '@vavito/api-client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  removeReactionAction,
  setReactionAction,
} from '@web/features/engagement/actions/reaction.actions';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getSession: vi.fn(),
  removeReaction: vi.fn(),
  revalidatePath: vi.fn(),
  setReaction: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock('@web/lib/auth/authenticated-session', () => ({
  getAuthenticatedSession: mocks.getSession,
}));
vi.mock('@web/lib/api/api-client', () => ({
  createWebAuthenticatedApiClient: mocks.createClient,
}));
vi.mock('@web/features/engagement/services/reactions-api.service', () => ({
  removeReaction: mocks.removeReaction,
  setReaction: mocks.setReaction,
}));

const client = {} as ApiClient;

describe('ações de reações', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createClient.mockReturnValue(client);
    mocks.getSession.mockResolvedValue({ accessToken: 'token', email: 'maria@example.com' });
    mocks.setReaction.mockResolvedValue({ counts: { dislike: 1, like: 5 }, reaction: 'LIKE' });
    mocks.removeReaction.mockResolvedValue(undefined);
  });

  it('registra a reação com a sessão atual e revalida o artigo', async () => {
    await expect(setReactionAction('artigo', 'post-id', 'LIKE')).resolves.toEqual({
      data: { counts: { dislike: 1, like: 5 }, reaction: 'LIKE' },
      ok: true,
    });
    expect(mocks.setReaction).toHaveBeenCalledWith('post-id', 'LIKE', client);
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/artigos/artigo');
  });

  it('remove a reação repetida e revalida o artigo', async () => {
    await expect(removeReactionAction('artigo', 'post-id')).resolves.toEqual({
      data: null,
      ok: true,
    });
    expect(mocks.removeReaction).toHaveBeenCalledWith('post-id', client);
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/artigos/artigo');
  });

  it('rejeita dados inválidos e sessão ausente sem chamar o servidor', async () => {
    await expect(setReactionAction('artigo', 'post-id', 'OUTRA')).resolves.toMatchObject({
      ok: false,
    });

    mocks.getSession.mockResolvedValueOnce(null);
    await expect(removeReactionAction('artigo', 'post-id')).resolves.toEqual({
      message: 'Sua sessão expirou. Entre novamente para continuar.',
      ok: false,
    });
    expect(mocks.setReaction).not.toHaveBeenCalled();
    expect(mocks.removeReaction).not.toHaveBeenCalled();
  });

  it('retorna uma mensagem segura quando a atualização falha', async () => {
    mocks.setReaction.mockRejectedValueOnce(new Error('detalhe interno'));

    await expect(setReactionAction('artigo', 'post-id', 'DISLIKE')).resolves.toEqual({
      message: 'Não foi possível registrar sua reação agora.',
      ok: false,
    });
  });
});
