import type { Middleware } from 'openapi-fetch';

import { ApiClientError } from '../errors/api-client.error.ts';

async function readErrorBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type');

  if (!contentType?.includes('application/json')) {
    return null;
  }

  try {
    return (await response.clone().json()) as unknown;
  } catch {
    return null;
  }
}

export function createErrorMiddleware(): Middleware {
  return {
    onError({ error }) {
      return error instanceof ApiClientError ? error : ApiClientError.network(error);
    },
    async onResponse({ response }) {
      if (response.ok) {
        return;
      }

      throw ApiClientError.fromResponse(response, await readErrorBody(response));
    },
  };
}
