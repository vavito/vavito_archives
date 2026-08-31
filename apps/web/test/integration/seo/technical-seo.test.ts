import { describe, expect, it, vi } from 'vitest';

const { getPostSitemapData } = vi.hoisted(() => ({ getPostSitemapData: vi.fn() }));

vi.mock('@web/features/posts', () => ({ getPostSitemapData }));

import robots from '@web/app/robots';
import sitemap from '@web/app/sitemap';
import { createPublicPageMetadata } from '@web/lib/seo/metadata';

describe('SEO técnico', () => {
  it('cria metadata pública com URL canônica absoluta', () => {
    expect(
      createPublicPageMetadata({
        description: 'Conheça o projeto.',
        pathname: '/sobre',
        title: 'Sobre',
      }),
    ).toMatchObject({
      alternates: { canonical: 'https://vavitoarchives.com.br/sobre' },
      openGraph: {
        type: 'website',
        url: 'https://vavitoarchives.com.br/sobre',
      },
      title: 'Sobre',
      twitter: { card: 'summary_large_image' },
    });
  });

  it('permite páginas públicas e impede rastreamento das áreas privadas', () => {
    expect(robots()).toEqual({
      host: 'https://vavitoarchives.com.br',
      rules: {
        allow: '/',
        disallow: ['/admin', '/auth', '/design-system', '/perfil', '/salvos'],
        userAgent: '*',
      },
      sitemap: 'https://vavitoarchives.com.br/sitemap.xml',
    });
  });

  it('combina páginas institucionais e artigos publicados no sitemap', async () => {
    getPostSitemapData.mockResolvedValueOnce([
      { publishedAt: '2026-08-20T12:00:00.000Z', slug: 'arquitetura-nestjs' },
    ]);

    const entries = await sitemap();

    expect(entries).toContainEqual(
      expect.objectContaining({ url: 'https://vavitoarchives.com.br/sobre' }),
    );
    expect(entries).toContainEqual({
      changeFrequency: 'monthly',
      lastModified: '2026-08-20T12:00:00.000Z',
      priority: 0.8,
      url: 'https://vavitoarchives.com.br/artigos/arquitetura-nestjs',
    });
  });

  it('mantém as páginas estáticas no sitemap quando a listagem de artigos falha', async () => {
    getPostSitemapData.mockRejectedValueOnce(new Error('Servidor indisponível'));

    const entries = await sitemap();

    expect(entries).toHaveLength(5);
    expect(entries).toContainEqual(
      expect.objectContaining({ url: 'https://vavitoarchives.com.br/' }),
    );
  });
});
