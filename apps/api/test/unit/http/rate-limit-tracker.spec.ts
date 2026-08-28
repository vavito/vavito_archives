import { createRateLimitTracker } from '@api/core/http/security/rate-limit-tracker';

describe('createRateLimitTracker', () => {
  it('limita o usuário autenticado pela identidade, independentemente do IP', () => {
    const user = { email: 'leitor@example.com', id: '6a84dba4-691a-4720-b1f6-bb835e486876' };

    expect(createRateLimitTracker({ ip: '203.0.113.1', user })).toBe(
      createRateLimitTracker({ ip: '203.0.113.2', user }),
    );
  });

  it('limita o visitante pelo primeiro IP interpretado do proxy', () => {
    const proxied = createRateLimitTracker({ ip: '127.0.0.1', ips: ['203.0.113.10'] });
    const direct = createRateLimitTracker({ ip: '203.0.113.10' });

    expect(proxied).toBe(direct);
    expect(proxied).toMatch(/^[a-f\d]{64}$/);
    expect(proxied).not.toContain('203.0.113.10');
  });

  it('separa identidades autenticadas e anônimas com o mesmo valor textual', () => {
    const id = '203.0.113.10';

    expect(createRateLimitTracker({ ip: id })).not.toBe(
      createRateLimitTracker({ user: { email: 'leitor@example.com', id } }),
    );
  });
});
