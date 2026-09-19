import { describe, expect, it, vi } from 'vitest';

const { getPostSitemapData } = vi.hoisted(() => ({ getPostSitemapData: vi.fn() }));

vi.mock('@web/features/posts', () => ({ getPostSitemapData }));

import robots from '@web/app/robots';
import sitemap from '@web/app/sitemap';
import manifest from '@web/app/manifest';
import { createPublicPageMetadata } from '@web/lib/seo/metadata';
import { createWebsiteStructuredData, serializeStructuredData } from '@web/lib/seo/structured-data';

describe('SEO técnico', () => {
  it('identifica o site e os nomes alternativos para os buscadores', () => {
    const structuredData = createWebsiteStructuredData();

    expect(structuredData).toEqual({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      alternateName: ['Vavito', 'vavitoarchives.com.br'],
      inLanguage: 'pt-BR',
      name: 'Vavito Archives',
      url: 'https://vavitoarchives.com.br/',
    });
    expect(serializeStructuredData(structuredData)).toContain('"@type":"WebSite"');
  });

  it('expõe a identidade visual e os ícones instaláveis no manifesto', () => {
    expect(manifest()).toEqual({
      background_color: '#18191b',
      description:
        'Artigos sobre desenvolvimento de software, arquitetura, produto e os aprendizados por trás de cada projeto.',
      display: 'standalone',
      icons: [
        { sizes: '192x192', src: '/brand/icon-192.png', type: 'image/png' },
        { sizes: '512x512', src: '/brand/icon-512.png', type: 'image/png' },
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
      name: 'Vavito Archives',
      orientation: 'portrait-primary',
      short_name: 'Vavito',
      start_url: '/',
      theme_color: '#18191b',
    });
  });

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
