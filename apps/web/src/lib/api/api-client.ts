import {
  createAuthenticatedApiClient,
  createPublicApiClient,
  type AccessTokenProvider,
  type ApiClient,
} from '@vavito/api-client';

import { getApiBaseUrl } from '../env/public-env';

export function createWebPublicApiClient(): ApiClient {
  return createPublicApiClient({ baseUrl: getApiBaseUrl() });
}

export function createWebAuthenticatedApiClient(getAccessToken: AccessTokenProvider): ApiClient {
  return createAuthenticatedApiClient({
    baseUrl: getApiBaseUrl(),
    getAccessToken,
  });
}
