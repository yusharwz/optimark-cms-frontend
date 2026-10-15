import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'file.usahakreatif.co.id',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.dritech.co.id',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.optimark.ai',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.r2.dev',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.cloudflarestorage.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
