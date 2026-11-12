/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  async headers() {
    const longCache = [{ key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' }];
    return [
      { source: '/:file(logo.png|logo-light.png|ywca-logo.png|YWCA-Camp-Packing-List.pdf)', headers: longCache },
    ];
  },
};

module.exports = nextConfig;
