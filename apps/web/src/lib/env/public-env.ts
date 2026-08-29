const LOCAL_API_URL = 'http://localhost:3001';

export interface SupabasePublicEnvironment {
  publishableKey: string;
  url: string;
}

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

export function getSupabasePublicEnvironment(): SupabasePublicEnvironment {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL deve ser configurada para o frontend.');
  }

  if (!publishableKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY deve ser configurada para o frontend.');
  }

  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.protocol !== 'https:' && parsedUrl.hostname !== 'localhost') {
      throw new Error();
    }

    return { publishableKey, url: parsedUrl.origin };
  } catch {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL deve conter uma origem HTTP válida.');
  }
}
