import type { Metadata } from 'next';

import { absoluteSiteUrl, SITE_LOCALE, SITE_NAME } from './site';

interface PublicPageMetadataOptions {
  absoluteTitle?: boolean;
  description: string;
  pathname: string;
  title: string;
}

export function createPublicPageMetadata({
  absoluteTitle = false,
  description,
  pathname,
  title,
}: PublicPageMetadataOptions): Metadata {
  const canonicalUrl = absoluteSiteUrl(pathname);

  return {
    alternates: { canonical: canonicalUrl },
    description,
    openGraph: {
      description,
      locale: SITE_LOCALE,
      siteName: SITE_NAME,
      title,
      type: 'website',
      url: canonicalUrl,
    },
    title: absoluteTitle ? { absolute: title } : title,
    twitter: {
      card: 'summary_large_image',
      description,
      title,
    },
  };
}
