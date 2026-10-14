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
    ],
  },
};

export default nextConfig;
