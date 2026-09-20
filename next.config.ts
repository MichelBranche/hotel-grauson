import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so an unrelated lockfile further up the tree is ignored.
  turbopack: { root: __dirname },
  outputFileTracingIncludes: {
    "/*": ["./pms-core/prisma/demo.db"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // 95 for the home hero on retina; 88 for other heroes; 75 elsewhere.
    qualities: [60, 75, 88, 95],
    deviceSizes: [640, 750, 828, 1080, 1200, 1600, 1920, 2560],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 14,
  },
  async headers() {
    return [
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source: "/:path*.woff2",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [{ source: "/camere/famiglia", destination: "/camere/standard", permanent: true }];
  },
};

export default nextConfig;
