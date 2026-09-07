import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { uploadAuthenticatedFormData } from '@web/lib/api/upload-form-data';

class FakeXMLHttpRequest extends EventTarget {
  static instances: FakeXMLHttpRequest[] = [];

  readonly headers = new Map<string, string>();
  readonly upload = new EventTarget();
  method = '';
  requestBody: Document | XMLHttpRequestBodyInit | null = null;
  responseText = '';
  responseHeaders = new Map<string, string>();
  status = 0;
  statusText = '';
  timeout = 0;
  url = '';

  constructor() {
    super();
    FakeXMLHttpRequest.instances.push(this);
  }

  abort() {
    this.dispatchEvent(new Event('abort'));
  }

  getResponseHeader(name: string): string | null {
    return this.responseHeaders.get(name.toLowerCase()) ?? null;
  }

  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }

  respond(status: number, body: unknown) {
    this.status = status;
    this.statusText = status >= 400 ? 'Error' : 'Created';
    this.responseText = JSON.stringify(body);
    this.responseHeaders.set('content-type', 'application/json');
    this.dispatchEvent(new Event('load'));
  }

  send(body: Document | XMLHttpRequestBodyInit | null) {
    this.requestBody = body;
  }

  setRequestHeader(name: string, value: string) {
    this.headers.set(name, value);
  }
}

describe('upload multipart com progresso', () => {
  beforeEach(() => {
    FakeXMLHttpRequest.instances = [];
    vi.stubGlobal('XMLHttpRequest', FakeXMLHttpRequest);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('autentica, acompanha o progresso e devolve a resposta da API', async () => {
    const formData = new FormData();
    formData.set('altText', 'Diagrama');
    const onProgress = vi.fn();
    const upload = uploadAuthenticatedFormData<{ id: string }>('/api/v1/admin/media', formData, {
      getAccessToken: () => 'admin-token',
      onProgress,
      timeoutMs: 30_000,
    });

    await vi.waitFor(() => expect(FakeXMLHttpRequest.instances).toHaveLength(1));
    const xhr = FakeXMLHttpRequest.instances[0]!;
    xhr.upload.dispatchEvent(
      new ProgressEvent('progress', { lengthComputable: true, loaded: 45, total: 100 }),
    );
    xhr.respond(201, { id: 'media-id' });

    await expect(upload).resolves.toEqual({ id: 'media-id' });
    expect(xhr.method).toBe('POST');
    expect(xhr.url).toBe(`${window.location.origin}/api/v1/admin/media`);
    expect(xhr.headers.get('Authorization')).toBe('Bearer admin-token');
    expect(xhr.requestBody).toBe(formData);
    expect(onProgress).toHaveBeenCalledWith({
      loadedBytes: 45,
      percentage: 45,
      totalBytes: 100,
    });
    expect(onProgress).toHaveBeenLastCalledWith({
      loadedBytes: 100,
      percentage: 100,
      totalBytes: 100,
    });
  });

  it('preserva a mensagem segura devolvida pela API', async () => {
    const upload = uploadAuthenticatedFormData('/api/v1/admin/media', new FormData(), {
      getAccessToken: () => 'admin-token',
    });

    await vi.waitFor(() => expect(FakeXMLHttpRequest.instances).toHaveLength(1));
    FakeXMLHttpRequest.instances[0]!.respond(413, {
      code: 'PAYLOAD_TOO_LARGE',
      details: null,
      message: 'A imagem deve ter no máximo 10 MB.',
      path: '/api/v1/admin/media',
      requestId: 'request-id',
      statusCode: 413,
      timestamp: '2026-09-05T12:00:00.000Z',
    });

    await expect(upload).rejects.toMatchObject({
      code: 'PAYLOAD_TOO_LARGE',
      message: 'A imagem deve ter no máximo 10 MB.',
      statusCode: 413,
    });
  });

  it('interrompe a requisição quando o usuário cancela o envio', async () => {
    const abortController = new AbortController();
    const upload = uploadAuthenticatedFormData('/api/v1/admin/media', new FormData(), {
      getAccessToken: () => 'admin-token',
      signal: abortController.signal,
    });

    await vi.waitFor(() => expect(FakeXMLHttpRequest.instances).toHaveLength(1));
    abortController.abort();

    await expect(upload).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('não inicia a requisição sem uma sessão válida', async () => {
    await expect(
      uploadAuthenticatedFormData('/api/v1/admin/media', new FormData(), {
        getAccessToken: () => null,
      }),
    ).rejects.toMatchObject({ code: 'AUTH_TOKEN_MISSING' });
    expect(FakeXMLHttpRequest.instances).toHaveLength(0);
  });

  it('não abre a conexão quando o envio já foi cancelado', async () => {
    const abortController = new AbortController();
    abortController.abort();

    await expect(
      uploadAuthenticatedFormData('/api/v1/admin/media', new FormData(), {
        getAccessToken: () => 'admin-token',
        signal: abortController.signal,
      }),
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(FakeXMLHttpRequest.instances).toHaveLength(0);
  });
});
