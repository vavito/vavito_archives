import type { MetadataRoute } from 'next';

import { SITE_DESCRIPTION, SITE_NAME } from '@web/lib/seo/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: '#18191b',
    description: SITE_DESCRIPTION,
    display: 'standalone',
    icons: [
      {
        sizes: '192x192',
        src: '/brand/icon-192.png',
        type: 'image/png',
      },
      {
        sizes: '512x512',
        src: '/brand/icon-512.png',
        type: 'image/png',
      },
      {
        purpose: 'maskable',
        sizes: '192x192',
        src: '/brand/icon-maskable-192.png',
        type: 'image/png',
      },
      {
        purpose: 'maskable',
        sizes: '512x512',
        src: '/brand/icon-maskable-512.png',
        type: 'image/png',
      },
    ],
    lang: 'pt-BR',
    name: SITE_NAME,
    orientation: 'portrait-primary',
    short_name: 'Vavito',
    start_url: '/',
    theme_color: '#18191b',
  };
}
