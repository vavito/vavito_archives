import createClient, { type Client, type ClientOptions } from 'openapi-fetch';

import { ApiClientError } from '../errors/api-client.error.ts';
import type { paths } from '../generated/schema.ts';
import { createAuthMiddleware, type AccessTokenProvider } from './auth-middleware.ts';
import { normalizeApiBaseUrl } from './base-url.ts';
import { createErrorMiddleware } from './error-middleware.ts';

export type ApiClient = Client<paths>;

export interface PublicApiClientOptions extends Omit<ClientOptions, 'baseUrl'> {
  baseUrl: string;
  requestTimeoutMs?: number;
}

export interface AuthenticatedApiClientOptions extends PublicApiClientOptions {
  getAccessToken: AccessTokenProvider;
}

type FetchImplementation = NonNullable<ClientOptions['fetch']>;

const defaultFetch: FetchImplementation = (request) => globalThis.fetch(request);

function createTimedFetch(
  fetchImplementation: FetchImplementation,
  timeoutMs: number,
): FetchImplementation {
  return async (request) => {
    const controller = new AbortController();
    const requestSignal = request.signal;
    let timedOut = false;

    const abortFromRequest = () => controller.abort(requestSignal?.reason);

    if (requestSignal?.aborted) {
      abortFromRequest();
    } else {
      requestSignal?.addEventListener('abort', abortFromRequest, { once: true });
    }

    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);

    try {
      return await fetchImplementation(new Request(request, { signal: controller.signal }));
    } catch (error) {
      if (timedOut) {
        throw ApiClientError.timeout(error);
      }

      throw error;
    } finally {
      clearTimeout(timeout);
      requestSignal?.removeEventListener('abort', abortFromRequest);
    }
  };
}

export function createPublicApiClient(options: PublicApiClientOptions): ApiClient {
  const {
    baseUrl,
    fetch: fetchImplementation = defaultFetch,
    requestTimeoutMs,
    ...clientOptions
  } = options;

  if (
    requestTimeoutMs !== undefined &&
    (!Number.isFinite(requestTimeoutMs) || requestTimeoutMs <= 0)
  ) {
    throw new TypeError('O tempo limite da requisição deve ser maior que zero.');
  }

  const client = createClient<paths>({
    ...clientOptions,
    baseUrl: normalizeApiBaseUrl(baseUrl),
    fetch:
      requestTimeoutMs === undefined
        ? fetchImplementation
        : createTimedFetch(fetchImplementation, requestTimeoutMs),
  });

  client.use(createErrorMiddleware());

  return client;
}

export function createAuthenticatedApiClient(options: AuthenticatedApiClientOptions): ApiClient {
  const { getAccessToken, ...clientOptions } = options;
  const client = createPublicApiClient(clientOptions);

  client.use(createAuthMiddleware(getAccessToken));

  return client;
}

export type { AccessTokenProvider } from './auth-middleware.ts';
