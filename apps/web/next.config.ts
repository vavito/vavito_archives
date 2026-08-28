import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ['@vavito/ui'],
  typedRoutes: true,
};

export default nextConfig;
