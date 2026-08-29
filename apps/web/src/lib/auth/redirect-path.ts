const DEFAULT_REDIRECT_PATH = '/';
const INTERNAL_REDIRECT_ORIGIN = 'https://vavito.local';

export function getSafeRedirectPath(
  candidate: string | null,
  fallback = DEFAULT_REDIRECT_PATH,
): string {
  if (!candidate) {
    return fallback;
  }

  try {
    const redirectUrl = new URL(candidate, INTERNAL_REDIRECT_ORIGIN);

    if (redirectUrl.origin !== INTERNAL_REDIRECT_ORIGIN) {
      return fallback;
    }

    return `${redirectUrl.pathname}${redirectUrl.search}${redirectUrl.hash}`;
  } catch {
    return fallback;
  }
}
