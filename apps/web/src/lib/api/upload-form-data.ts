'use client';

import 'client-only';

import { ApiClientError, type AccessTokenProvider } from '@vavito/api-client';

import { getApiBaseUrl } from '../env/public-env';

export interface UploadProgress {
  loadedBytes: number;
  percentage: number | null;
  totalBytes: number | null;
}

interface UploadAuthenticatedFormDataOptions {
  getAccessToken: AccessTokenProvider;
  onProgress?: (progress: UploadProgress) => void;
  signal?: AbortSignal;
  timeoutMs?: number;
}

function responseBody(xhr: XMLHttpRequest): unknown {
  if (!xhr.responseText) {
    return null;
  }

  try {
    return JSON.parse(xhr.responseText) as unknown;
  } catch {
    return null;
  }
}

function responseHeaders(xhr: XMLHttpRequest): Headers {
  const headers = new Headers();
  const contentType = xhr.getResponseHeader('content-type');
  const requestId = xhr.getResponseHeader('x-request-id');

  if (contentType) {
    headers.set('content-type', contentType);
  }

  if (requestId) {
    headers.set('x-request-id', requestId);
  }

  return headers;
}

function apiError(xhr: XMLHttpRequest): ApiClientError {
  const response = new Response(xhr.responseText || null, {
    headers: responseHeaders(xhr),
    status: xhr.status,
    statusText: xhr.statusText,
  });

  return ApiClientError.fromResponse(response, responseBody(xhr));
}

export async function uploadAuthenticatedFormData<T>(
  path: `/${string}`,
  formData: FormData,
  options: UploadAuthenticatedFormDataOptions,
): Promise<T> {
  const accessToken = (await options.getAccessToken())?.trim();

  if (!accessToken) {
    throw ApiClientError.missingAccessToken();
  }

  if (options.signal?.aborted) {
    throw new DOMException('Upload cancelado.', 'AbortError');
  }

  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const abort = () => xhr.abort();
    let lastLoadedBytes = 0;
    let lastTotalBytes: number | null = null;
    let settled = false;

    const finish = (callback: () => void) => {
      if (settled) {
        return;
      }

      settled = true;
      options.signal?.removeEventListener('abort', abort);
      callback();
    };

    xhr.open('POST', `${getApiBaseUrl()}${path}`);
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);

    if (options.timeoutMs !== undefined) {
      xhr.timeout = options.timeoutMs;
    }

    xhr.upload.addEventListener('progress', (event) => {
      const totalBytes = event.lengthComputable && event.total > 0 ? event.total : null;
      lastLoadedBytes = event.loaded;
      lastTotalBytes = totalBytes;
      options.onProgress?.({
        loadedBytes: event.loaded,
        percentage: totalBytes
          ? Math.min(100, Math.round((event.loaded / totalBytes) * 100))
          : null,
        totalBytes,
      });
    });
    xhr.addEventListener('load', () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        finish(() => reject(apiError(xhr)));
        return;
      }

      finish(() => {
        options.onProgress?.({
          loadedBytes: lastTotalBytes ?? lastLoadedBytes,
          percentage: 100,
          totalBytes: lastTotalBytes,
        });
        resolve(responseBody(xhr) as T);
      });
    });
    xhr.addEventListener('error', () => finish(() => reject(ApiClientError.network(null))));
    xhr.addEventListener('timeout', () => finish(() => reject(ApiClientError.timeout(null))));
    xhr.addEventListener('abort', () =>
      finish(() => reject(new DOMException('Upload cancelado.', 'AbortError'))),
    );

    options.signal?.addEventListener('abort', abort, { once: true });
    options.onProgress?.({ loadedBytes: 0, percentage: 0, totalBytes: null });
    xhr.send(formData);
  });
}
