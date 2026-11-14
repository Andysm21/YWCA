/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // Vercel image optimizer: resizes + converts to WebP/AVIF (used by logos and gallery photos).
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2592000,
    remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' }],
  },
  async redirects() {
    // Teen Camp was renamed Teens Camp — keep old links (emails, shares) working.
    return [
      { source: '/camps/teen-camp-2026', destination: '/camps/teens-camp-2026', permanent: true },
      { source: '/register/teen-camp-2026', destination: '/register/teens-camp-2026', permanent: true },
    ];
  },
  async headers() {
    const longCache = [{ key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' }];
    const security = [
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
      {
        key: 'Content-Security-Policy',
        value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'; upgrade-insecure-requests",
      },
    ];
    return [
      { source: '/:path*', headers: security },
      { source: '/:file(logo.png|logo-light.png|ywca-logo.png|YWCA-Camp-Packing-List.pdf)', headers: longCache },
    ];
  },
};

module.exports = nextConfig;
