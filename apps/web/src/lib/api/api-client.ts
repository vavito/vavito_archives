import {
  createAuthenticatedApiClient,
  createPublicApiClient,
  type AccessTokenProvider,
  type ApiClient,
} from '@vavito/api-client';

import { getApiBaseUrl } from '../env/public-env';
import { WEB_API_REQUEST_TIMEOUT_MS } from './page-data-timeout';

export function createWebPublicApiClient(): ApiClient {
  return createPublicApiClient({
    baseUrl: getApiBaseUrl(),
    requestTimeoutMs: WEB_API_REQUEST_TIMEOUT_MS,
  });
}

export function createWebAuthenticatedApiClient(getAccessToken: AccessTokenProvider): ApiClient {
  return createAuthenticatedApiClient({
    baseUrl: getApiBaseUrl(),
    getAccessToken,
    requestTimeoutMs: WEB_API_REQUEST_TIMEOUT_MS,
  });
}
