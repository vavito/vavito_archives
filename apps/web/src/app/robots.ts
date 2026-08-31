import type { MetadataRoute } from 'next';

import { absoluteSiteUrl, SITE_URL } from '@web/lib/seo/site';

export default function robots(): MetadataRoute.Robots {
  return {
    host: SITE_URL.origin,
    rules: {
      allow: '/',
      disallow: ['/admin', '/auth', '/design-system', '/perfil', '/salvos'],
      userAgent: '*',
    },
    sitemap: absoluteSiteUrl('/sitemap.xml'),
  };
}
