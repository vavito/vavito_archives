import type { Middleware } from 'openapi-fetch';

import { ApiClientError } from '../errors/api-client.error.js';

export type AccessTokenProvider = () =>
  Promise<string | null | undefined> | string | null | undefined;

export function createAuthMiddleware(getAccessToken: AccessTokenProvider): Middleware {
  return {
    async onRequest({ request }) {
      const accessToken = (await getAccessToken())?.trim();

      if (!accessToken) {
        throw ApiClientError.missingAccessToken();
      }

      request.headers.set('Authorization', `Bearer ${accessToken}`);

      return request;
    },
  };
}
