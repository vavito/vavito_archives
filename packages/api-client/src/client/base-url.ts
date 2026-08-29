export function normalizeApiBaseUrl(baseUrl: string): string {
  const value = baseUrl.trim();

  if (!value) {
    throw new TypeError('A base URL da API não pode ser vazia.');
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch (error) {
    throw new TypeError('A base URL da API deve ser uma URL absoluta válida.', { cause: error });
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new TypeError('A base URL da API deve usar HTTP ou HTTPS.');
  }

  if (url.username || url.password) {
    throw new TypeError('A base URL da API não pode conter credenciais.');
  }

  url.hash = '';
  url.search = '';

  return url.toString().replace(/\/$/, '');
}
