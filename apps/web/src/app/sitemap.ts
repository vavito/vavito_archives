import type { MetadataRoute } from 'next';

import { getPostSitemapData } from '@web/features/posts';
import { absoluteSiteUrl } from '@web/lib/seo/site';

export const dynamic = 'force-dynamic';

const staticEntries: MetadataRoute.Sitemap = [
  { changeFrequency: 'weekly', priority: 1, url: absoluteSiteUrl('/') },
  { changeFrequency: 'daily', priority: 0.9, url: absoluteSiteUrl('/artigos') },
  { changeFrequency: 'monthly', priority: 0.6, url: absoluteSiteUrl('/sobre') },
  { changeFrequency: 'yearly', priority: 0.4, url: absoluteSiteUrl('/contato') },
  { changeFrequency: 'yearly', priority: 0.3, url: absoluteSiteUrl('/privacidade') },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const posts = await getPostSitemapData();

    return [
      ...staticEntries,
      ...posts.map((post) => ({
        changeFrequency: 'monthly' as const,
        lastModified: post.publishedAt,
        priority: 0.8,
        url: absoluteSiteUrl(`/artigos/${post.slug}`),
      })),
    ];
  } catch {
    return staticEntries;
  }
}
