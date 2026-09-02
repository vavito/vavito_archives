import type { NextConfig } from 'next';

const configuredDevOrigins =
  process.env.NEXT_ALLOWED_DEV_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.*.*', ...configuredDevOrigins],
  experimental: {
    serverActions: {
      bodySizeLimit: '3mb',
    },
  },
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ['@vavito/ui'],
  typedRoutes: true,
};

export default nextConfig;
