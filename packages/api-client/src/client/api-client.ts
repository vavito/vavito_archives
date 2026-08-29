import createClient, { type Client, type ClientOptions } from 'openapi-fetch';

import type { paths } from '../generated/schema.js';
import { createAuthMiddleware, type AccessTokenProvider } from './auth-middleware.js';
import { normalizeApiBaseUrl } from './base-url.js';
import { createErrorMiddleware } from './error-middleware.js';

export type ApiClient = Client<paths>;

export interface PublicApiClientOptions extends Omit<ClientOptions, 'baseUrl'> {
  baseUrl: string;
}

export interface AuthenticatedApiClientOptions extends PublicApiClientOptions {
  getAccessToken: AccessTokenProvider;
}

export function createPublicApiClient(options: PublicApiClientOptions): ApiClient {
  const { baseUrl, ...clientOptions } = options;
  const client = createClient<paths>({
    ...clientOptions,
    baseUrl: normalizeApiBaseUrl(baseUrl),
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

export type { AccessTokenProvider } from './auth-middleware.js';
