import { randomUUID } from 'node:crypto';

export const REQUEST_ID_HEADER = 'x-request-id';

interface RequestIdRequest {
  headers?: Record<string, string | string[] | undefined>;
  id?: unknown;
}

interface RequestIdResponse {
  setHeader(name: string, value: string): unknown;
}

export function isSafeRequestId(value: string): boolean {
  return /^[a-zA-Z0-9._:-]{1,128}$/.test(value);
}

function safeString(value: unknown): string | undefined {
  if (typeof value === 'number') return String(value);
  if (typeof value !== 'string') return undefined;

  return isSafeRequestId(value) ? value : undefined;
}

function requestIdHeader(request: RequestIdRequest): string | undefined {
  const header = request.headers?.[REQUEST_ID_HEADER];
  const candidate = Array.isArray(header) ? header[0] : header;

  return safeString(candidate);
}

export function requestIdFrom(request: RequestIdRequest): string {
  return safeString(request.id) ?? requestIdHeader(request) ?? randomUUID();
}

export function assignRequestId(request: RequestIdRequest, response: RequestIdResponse): string {
  const requestId = requestIdHeader(request) ?? randomUUID();

  response.setHeader(REQUEST_ID_HEADER, requestId);
  return requestId;
}
