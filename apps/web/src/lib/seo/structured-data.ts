import { SITE_ALTERNATE_NAMES, SITE_LANGUAGE, SITE_NAME, SITE_URL } from './site';

export function createWebsiteStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    alternateName: [...SITE_ALTERNATE_NAMES],
    inLanguage: SITE_LANGUAGE,
    name: SITE_NAME,
    url: SITE_URL.toString(),
  };
}

export function serializeStructuredData(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
