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
  async headers() {
    const longCache = [{ key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' }];
    return [
      { source: '/:file(logo.png|logo-light.png|ywca-logo.png|YWCA-Camp-Packing-List.pdf)', headers: longCache },
    ];
  },
};

module.exports = nextConfig;
