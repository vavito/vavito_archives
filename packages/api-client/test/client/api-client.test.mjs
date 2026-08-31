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

test('substitui detalhes de falhas internas por uma orientação amigável', async () => {
  const client = createPublicApiClient({
    baseUrl: apiBaseUrl,
    fetch: () =>
      Promise.resolve(
        createJsonResponse(
          {
            code: 'INTERNAL_ERROR',
            message: 'Erro interno do servidor.',
          },
          { status: 500 },
        ),
      ),
  });

  await assert.rejects(client.GET('/api/v1/health'), (error) => {
    assert.ok(error instanceof ApiClientError);
    assert.equal(
      error.message,
      'Algo deu errado do nosso lado. Tente novamente em alguns instantes.',
    );
    assert.doesNotMatch(error.message, /interno|API|HTTP/i);
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
    assert.equal(
      error.message,
      'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
    );
    assert.doesNotMatch(error.message, /socket details/);
    return true;
  });
});

test('interrompe requisições que ultrapassam o tempo limite configurado', async () => {
  const client = createPublicApiClient({
    baseUrl: apiBaseUrl,
    fetch: (request) =>
      new Promise((_, reject) => {
        const signal = request.signal;

        signal.addEventListener(
          'abort',
          () => reject(signal.reason ?? new Error('request aborted')),
          { once: true },
        );
      }),
    requestTimeoutMs: 10,
  });

  await assert.rejects(client.GET('/api/v1/health'), (error) => {
    assert.ok(error instanceof ApiClientError);
    assert.equal(error.code, 'REQUEST_TIMEOUT');
    assert.equal(error.message, 'O servidor demorou mais que o esperado. Tente novamente.');
    return true;
  });
});
