/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== 'production';
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// Extract origin only (strip path) so CSP connect-src is valid
const apiOrigin = (() => {
  try { return new URL(apiUrl).origin; } catch { return apiUrl; }
})();

const csp = [
  "default-src 'self'",
  // Scripts: self + Next.js inline scripts need unsafe-inline in dev; tighten in prod with nonces
  isDev ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'" : "script-src 'self'",
  // Styles: unsafe-inline needed for Tailwind's runtime styles
  "style-src 'self' 'unsafe-inline'",
  // Images: self + data URIs (used by rough.js canvas exports)
  "img-src 'self' data:",
  // Fonts
  "font-src 'self'",
  // API calls go to the backend origin only
  `connect-src 'self' ${apiOrigin}`,
  // Canvas: needed for rough.js
  "worker-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy',        value: csp },
  { key: 'X-Frame-Options',                value: 'DENY' },
  { key: 'X-Content-Type-Options',         value: 'nosniff' },
  { key: 'Referrer-Policy',                value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',             value: 'camera=(), microphone=(), geolocation=()' },
  // HSTS — only set in production; browsers won't enforce it over HTTP anyway
  ...(!isDev ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }] : []),
];

const nextConfig = {
  transpilePackages: ['@sds/shared-types', '@sds/ui'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
