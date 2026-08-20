import type { ConfigService } from '@nestjs/config';

import type { ApplicationConfig } from '@api/core/config/app.config';
import { PostViewFingerprintService } from '@api/modules/posts/services/post-view-fingerprint.service';

describe('PostViewFingerprintService', () => {
  const configService = {
    get: jest.fn(() => 'view-fingerprint-secret-with-at-least-32-characters'),
  } as unknown as ConfigService<ApplicationConfig, true>;
  const service = new PostViewFingerprintService(configService);
  const signal = { ip: '203.0.113.10', userAgent: 'Vavito Browser' };

  it('gera HMAC diário estável sem persistir o sinal técnico original', () => {
    const first = service.createDailyFingerprint(signal, '2026-08-19');
    const repeated = service.createDailyFingerprint(signal, '2026-08-19');
    const nextDay = service.createDailyFingerprint(signal, '2026-08-20');

    expect(first).toMatch(/^[a-f\d]{64}$/);
    expect(repeated).toBe(first);
    expect(nextDay).not.toBe(first);
    expect(first).not.toContain(signal.ip);
    expect(first).not.toContain(signal.userAgent);
  });

  it('separa a chave de rate limit do fingerprint persistido', () => {
    expect(service.createRateLimitKey(signal.ip)).not.toBe(
      service.createDailyFingerprint(signal, '2026-08-19'),
    );
  });
});
