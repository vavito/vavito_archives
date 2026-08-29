import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ApiClientError,
  createAuthenticatedApiClient,
  createPublicApiClient,
  normalizeApiBaseUrl,
} from '../../src/index.ts';

const apiBaseUrl = 'https://api.vavito.test';

function createJsonResponse(body, init = {}) {
  return Response.json(body, init);
}

test('normaliza a base URL sem aceitar protocolos ou credenciais inseguras', () => {
  assert.equal(normalizeApiBaseUrl(`${apiBaseUrl}/`), apiBaseUrl);
  assert.throws(() => normalizeApiBaseUrl('ftp://api.vavito.test'), /HTTP ou HTTPS/);
  assert.throws(() => normalizeApiBaseUrl('https://user:secret@api.vavito.test'), /credenciais/);
});

test('cliente público não envia Authorization', async () => {
  let receivedRequest;
  const client = createPublicApiClient({
    baseUrl: apiBaseUrl,
    fetch: (request) => {
      receivedRequest = request;
      return Promise.resolve(createJsonResponse({ status: 'ok' }));
    },
  });

  await client.GET('/api/v1/health');

  assert.equal(receivedRequest.headers.get('authorization'), null);
  assert.equal(receivedRequest.url, `${apiBaseUrl}/api/v1/health`);
});

test('cliente autenticado consulta o token mais recente em cada requisição', async () => {
  const receivedTokens = [];
  let accessToken = 'first-token';
  const client = createAuthenticatedApiClient({
    baseUrl: apiBaseUrl,
    fetch: (request) => {
      receivedTokens.push(request.headers.get('authorization'));
      return Promise.resolve(createJsonResponse({ status: 'ok' }));
    },
    getAccessToken: () => accessToken,
  });

  await client.GET('/api/v1/profiles/me');
  accessToken = 'second-token';
  await client.GET('/api/v1/profiles/me');

  assert.deepEqual(receivedTokens, ['Bearer first-token', 'Bearer second-token']);
});

test('cliente autenticado rejeita a requisição quando o token está ausente', async () => {
  let fetchWasCalled = false;
  const client = createAuthenticatedApiClient({
    baseUrl: apiBaseUrl,
    fetch: () => {
      fetchWasCalled = true;
      return Promise.resolve(createJsonResponse({ status: 'ok' }));
    },
    getAccessToken: () => null,
  });

  await assert.rejects(client.GET('/api/v1/profiles/me'), (error) => {
    assert.ok(error instanceof ApiClientError);
    assert.equal(error.code, 'AUTH_TOKEN_MISSING');
    return true;
  });
  assert.equal(fetchWasCalled, false);
});

test('normaliza o contrato de erro retornado pela API', async () => {
  const client = createPublicApiClient({
    baseUrl: apiBaseUrl,
    fetch: () =>
      Promise.resolve(
        createJsonResponse(
          {
            code: 'PROFILE_NOT_FOUND',
            details: null,
            message: 'Perfil não encontrado.',
            path: '/api/v1/profiles/me',
            requestId: 'request-123',
            statusCode: 404,
            timestamp: '2026-08-28T12:00:00.000Z',
          },
          { status: 404 },
        ),
      ),
  });

  await assert.rejects(client.GET('/api/v1/profiles/me'), (error) => {
    assert.ok(error instanceof ApiClientError);
    assert.equal(error.statusCode, 404);
    assert.equal(error.code, 'PROFILE_NOT_FOUND');
    assert.equal(error.requestId, 'request-123');
    return true;
  });
});

test('normaliza falhas de rede sem expor a causa na mensagem', async () => {
  const client = createPublicApiClient({
    baseUrl: apiBaseUrl,
    fetch: () => Promise.reject(new Error('socket details')),
  });

  await assert.rejects(client.GET('/api/v1/health'), (error) => {
    assert.ok(error instanceof ApiClientError);
    assert.equal(error.code, 'NETWORK_ERROR');
    assert.doesNotMatch(error.message, /socket details/);
    return true;
  });
});
