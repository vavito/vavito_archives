import type { NextConfig } from 'next';

const configuredDevOrigins =
  process.env.NEXT_ALLOWED_DEV_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];

const LOCAL_API_URL = 'http://localhost:3001';

const nextConfig: NextConfig = {
  distDir: process.env.VAVITO_E2E === 'true' ? '.next-e2e' : '.next',
  allowedDevOrigins: ['192.168.*.*', ...configuredDevOrigins],
  experimental: {
    serverActions: {
      bodySizeLimit: '3mb',
    },
  },
  poweredByHeader: false,
  reactStrictMode: true,
  rewrites() {
    if (process.env.NODE_ENV === 'production') return [];

    return [
      {
        destination: `${LOCAL_API_URL}/api/v1/:path*`,
        source: '/api/v1/:path*',
      },
    ];
  },
  transpilePackages: ['@vavito/ui'],
  typedRoutes: true,
};

export default nextConfig;
