import type { NextConfig } from 'next';

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  sw: '/service-worker.js',
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/middleware-manifest\.json$/],
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/firestore\.googleapis\.com/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'firestore-cache',
        expiration: { maxEntries: 200, maxAgeSeconds: 3600 },
      },
    },
    {
      urlPattern: /^https:\/\/storage\.googleapis\.com/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'firebase-storage',
        expiration: { maxEntries: 100, maxAgeSeconds: 86400 },
      },
    },
    {
      urlPattern: /\/api\//,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: { maxEntries: 50, maxAgeSeconds: 300 },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|ico|webp)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'image-cache',
        expiration: { maxEntries: 60, maxAgeSeconds: 604800 },
      },
    },
    {
      urlPattern: /\.(?:js|css|woff2?)$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-resources',
        expiration: { maxEntries: 60, maxAgeSeconds: 86400 },
      },
    },
  ],
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source: '/service-worker.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
        ],
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
