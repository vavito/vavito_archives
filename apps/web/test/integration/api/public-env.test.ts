import { afterEach, describe, expect, it, vi } from 'vitest';

import { getApiBaseUrl } from '@web/lib/env/public-env';

describe('getApiBaseUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('prioriza a URL configurada explicitamente', () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.example.com');

    expect(getApiBaseUrl()).toBe('https://api.example.com');
  });

  it('usa a origem atual no navegador durante o desenvolvimento', () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', '');
    vi.stubEnv('NODE_ENV', 'development');

    expect(getApiBaseUrl()).toBe(window.location.origin);
  });

  it('mantém a API local para renderização no servidor durante o desenvolvimento', () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', '');
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubGlobal('window', undefined);

    expect(getApiBaseUrl()).toBe('http://localhost:3001');
  });
});
