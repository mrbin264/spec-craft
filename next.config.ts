import type { NextConfig } from 'next';

// Bundle analyzer for development
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  // Enable compression for better performance
  compress: true,

  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
  },

  // Configure headers for caching
  async headers() {
    return [
      {
        // Cache static assets aggressively
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache images
        source: '/:path*.{jpg,jpeg,png,gif,svg,ico,webp,avif}',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache fonts
        source: '/:path*.{woff,woff2,ttf,otf,eot}',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Enable experimental features for better performance
  experimental: {
    // Optimize package imports
    optimizePackageImports: [
      '@tanstack/react-query',
      'react-markdown',
      'mermaid',
      '@xyflow/react',
    ],
  },

  // Note: Turbopack is enabled by default in Next.js 16 for development
  // Webpack configuration has been removed as Turbopack handles bundling
  // For production builds, Next.js still uses webpack with default optimizations
};

export default withBundleAnalyzer(nextConfig);
