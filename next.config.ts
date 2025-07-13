import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    domains: [],
  },
  env: {
    CUSTOM_KEY: process.env.NEXT_PUBLIC_EXCHANGE_RATE_API_KEY,
  },
  // 本番環境での最適化
  compress: true,
  poweredByHeader: false,
  // セキュリティヘッダー
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
}

export default nextConfig;
