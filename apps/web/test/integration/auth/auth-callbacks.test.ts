import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET as exchangeAuthCode } from '@web/app/(auth)/auth/callback/route';
import { GET as confirmAuthEmail } from '@web/app/(auth)/auth/confirm/route';

const supabaseMocks = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
  verifyOtp: vi.fn(),
}));
const newsletterMocks = vi.hoisted(() => ({ subscribeConfirmedAccount: vi.fn() }));

vi.mock('server-only', () => ({}));

vi.mock('@web/lib/auth/supabase/server', () => ({
  createServerSupabaseClient: () => Promise.resolve({ auth: supabaseMocks }),
}));
vi.mock('@web/features/newsletter/services/subscribe-confirmed-account', () => newsletterMocks);

describe('callbacks de autenticação', () => {
  beforeEach(() => {
    supabaseMocks.exchangeCodeForSession.mockResolvedValue({ error: null });
    supabaseMocks.verifyOtp.mockResolvedValue({ error: null });
    newsletterMocks.subscribeConfirmedAccount.mockResolvedValue(undefined);
  });

  it('troca o código PKCE pela sessão e redireciona somente dentro do site', async () => {
    const response = await exchangeAuthCode(
      new NextRequest('http://localhost:3000/auth/callback?code=code&next=/perfil'),
    );

    expect(supabaseMocks.exchangeCodeForSession).toHaveBeenCalledWith('code', undefined);
    expect(response.headers.get('location')).toBe('http://localhost:3000/perfil');
    expect(response.headers.get('cache-control')).toContain('private');
  });

  it('descarta um destino externo recebido no callback', async () => {
    const response = await exchangeAuthCode(
      new NextRequest(
        'http://localhost:3000/auth/callback?code=code&next=https://malicioso.example',
      ),
    );

    expect(response.headers.get('location')).toBe('http://localhost:3000/');
  });

  it('confirma o token por e-mail e abre a etapa de cadastro concluído', async () => {
    supabaseMocks.verifyOtp.mockResolvedValueOnce({
      data: { session: { access_token: 'access-token' } },
      error: null,
    });
    const response = await confirmAuthEmail(
      new NextRequest(
        'http://localhost:3000/auth/confirm?token_hash=hash&type=signup&next=/auth/confirmed',
      ),
    );

    expect(supabaseMocks.verifyOtp).toHaveBeenCalledWith({ token_hash: 'hash', type: 'signup' });
    expect(response.headers.get('location')).toBe('http://localhost:3000/auth/confirmed');
    expect(newsletterMocks.subscribeConfirmedAccount).toHaveBeenCalledWith('access-token');
  });

  it('usa a etapa de cadastro concluído como destino padrão da confirmação', async () => {
    const response = await confirmAuthEmail(
      new NextRequest('http://localhost:3000/auth/confirm?token_hash=hash&type=signup'),
    );

    expect(response.headers.get('location')).toBe('http://localhost:3000/auth/confirmed');
  });

  it('retorna uma mensagem segura quando a confirmação falha', async () => {
    supabaseMocks.verifyOtp.mockResolvedValueOnce({ error: new Error('token expirado') });

    const response = await confirmAuthEmail(
      new NextRequest('http://localhost:3000/auth/confirm?token_hash=hash&type=signup'),
    );

    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/auth?auth_error=confirmation_failed',
    );
  });

  it('valida o token de recuperação e abre a criação da nova senha', async () => {
    const response = await confirmAuthEmail(
      new NextRequest(
        'http://localhost:3000/auth/confirm?token_hash=hash&type=recovery&next=/auth/reset-password',
      ),
    );

    expect(supabaseMocks.verifyOtp).toHaveBeenCalledWith({ token_hash: 'hash', type: 'recovery' });
    expect(response.headers.get('location')).toBe('http://localhost:3000/auth/reset-password');
  });
});
