const LOCAL_API_URL = 'http://localhost:3001';

export function getApiBaseUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (configuredUrl) {
    return configuredUrl;
  }

  if (process.env.NODE_ENV !== 'production') {
    return LOCAL_API_URL;
  }

  throw new Error('NEXT_PUBLIC_API_URL deve ser configurada para o frontend em produção.');
}
