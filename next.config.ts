import type { NextConfig } from 'next';

const securityHeaders: Array<{ key: string; value: string }> = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

// Bypassed in development: Next's Fast Refresh relies on eval + inline scripts.
// Enforced in production (and Vercel previews, which build with NODE_ENV=production).
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  // img-src/connect-src: allow Vercel Blob (Documents) + OAuth provider avatars.
  "img-src 'self' data: blob: https://*.vercel-storage.com https://*.vercel-blob.com https://*.googleusercontent.com https://avatars.githubusercontent.com",
  "font-src 'self'",
  "connect-src 'self' https://*.vercel-storage.com https://*.vercel-blob.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          ...securityHeaders,
          ...(process.env.NODE_ENV === 'production'
            ? [{ key: 'Content-Security-Policy', value: contentSecurityPolicy }]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
