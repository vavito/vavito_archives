import { afterEach, describe, expect, it, vi } from 'vitest';

import { PageDataTimeoutError, withPageDataTimeout } from '@web/lib/api/page-data-timeout';

describe('prazo do carregamento de dados da página', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('retorna os dados quando o servidor responde dentro do prazo', async () => {
    await expect(withPageDataTimeout(() => Promise.resolve('conteúdo'), 100)).resolves.toBe(
      'conteúdo',
    );
  });

  it('interrompe a espera da página mesmo quando a operação nunca responde', async () => {
    vi.useFakeTimers();
    const result = withPageDataTimeout(() => new Promise<never>(() => undefined), 100);
    const expectation = expect(result).rejects.toBeInstanceOf(PageDataTimeoutError);

    await vi.advanceTimersByTimeAsync(100);

    await expectation;
  });
});
