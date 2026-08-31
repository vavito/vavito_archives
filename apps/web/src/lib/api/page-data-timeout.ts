export const WEB_API_REQUEST_TIMEOUT_MS = 8_000;

export class PageDataTimeoutError extends Error {
  constructor() {
    super('O servidor demorou mais que o esperado para responder.');
    this.name = 'PageDataTimeoutError';
  }
}

export async function withPageDataTimeout<T>(
  loadData: () => Promise<T>,
  timeoutMs = WEB_API_REQUEST_TIMEOUT_MS,
): Promise<T> {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new TypeError('O tempo limite do carregamento deve ser maior que zero.');
  }

  let timeout: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new PageDataTimeoutError()), timeoutMs);
  });

  try {
    return await Promise.race([loadData(), deadline]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}
