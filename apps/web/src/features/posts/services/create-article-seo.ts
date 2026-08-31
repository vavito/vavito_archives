import type { Metadata } from 'next';

import {
  absoluteSiteUrl,
  SITE_AUTHOR,
  SITE_LANGUAGE,
  SITE_LOCALE,
  SITE_NAME,
  SITE_URL,
} from '@web/lib/seo/site';

import type { PostDetail } from '../types/posts.types';

function articleTitle(post: PostDetail): string {
  return post.seoTitle?.trim() || post.title;
}

function articleDescription(post: PostDetail): string {
  return post.seoDescription?.trim() || post.excerpt;
}

export function createArticleMetadata(post: PostDetail): Metadata {
  const canonicalUrl = absoluteSiteUrl(`/artigos/${post.slug}`);
  const description = articleDescription(post);
  const title = articleTitle(post);
  const socialImages = post.coverUrl
    ? [
        {
          alt: post.coverAlt ?? post.title,
          url: post.coverUrl,
        },
      ]
    : undefined;

  return {
    alternates: { canonical: canonicalUrl },
    description,
    keywords: post.tags.map((tag) => tag.name),
    openGraph: {
      authors: [SITE_AUTHOR],
      description,
      images: socialImages,
      locale: SITE_LOCALE,
      publishedTime: post.publishedAt,
      siteName: SITE_NAME,
      tags: post.tags.map((tag) => tag.name),
      title,
      type: 'article',
      url: canonicalUrl,
    },
    title: post.seoTitle?.trim() ? { absolute: title } : title,
    twitter: {
      card: 'summary_large_image',
      description,
      images: socialImages?.map((image) => image.url),
      title,
    },
  };
}

export function createArticleStructuredData(post: PostDetail) {
  const canonicalUrl = absoluteSiteUrl(`/artigos/${post.slug}`);

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    author: {
      '@type': 'Person',
      name: SITE_AUTHOR,
      url: SITE_URL.toString(),
    },
    datePublished: post.publishedAt,
    description: articleDescription(post),
    headline: articleTitle(post),
    ...(post.coverUrl ? { image: [post.coverUrl] } : {}),
    inLanguage: SITE_LANGUAGE,
    keywords: post.tags.map((tag) => tag.name).join(', '),
    mainEntityOfPage: canonicalUrl,
    publisher: {
      '@type': 'Person',
      name: SITE_AUTHOR,
      url: SITE_URL.toString(),
    },
    url: canonicalUrl,
  };
}
