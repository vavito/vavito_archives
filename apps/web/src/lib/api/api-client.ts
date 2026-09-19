import {
  createAuthenticatedApiClient,
  createPublicApiClient,
  type AccessTokenProvider,
  type ApiClient,
} from '@vavito/api-client';

import { getApiBaseUrl } from '../env/public-env';
import { WEB_API_REQUEST_TIMEOUT_MS } from './page-data-timeout';

const PUBLIC_CONTENT_CACHE_TAG = 'public-content';
const PUBLIC_CONTENT_REVALIDATE_SECONDS = 30;

function createPublicContentFetch() {
  return (request: Request): Promise<Response> => {
    if (typeof window !== 'undefined') {
      return globalThis.fetch(request);
    }

    return globalThis.fetch(request, {
      next: {
        revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS,
        tags: [PUBLIC_CONTENT_CACHE_TAG],
      },
    });
  };
}

export function createWebPublicApiClient(): ApiClient {
  return createPublicApiClient({
    baseUrl: getApiBaseUrl(),
    requestTimeoutMs: WEB_API_REQUEST_TIMEOUT_MS,
  });
}

export function createWebCachedPublicApiClient(): ApiClient {
  return createPublicApiClient({
    baseUrl: getApiBaseUrl(),
    fetch: createPublicContentFetch(),
    requestTimeoutMs: WEB_API_REQUEST_TIMEOUT_MS,
  });
}

export function createWebAuthenticatedApiClient(
  getAccessToken: AccessTokenProvider,
  requestTimeoutMs = WEB_API_REQUEST_TIMEOUT_MS,
): ApiClient {
  return createAuthenticatedApiClient({
    baseUrl: getApiBaseUrl(),
    getAccessToken,
    requestTimeoutMs,
  });
}
