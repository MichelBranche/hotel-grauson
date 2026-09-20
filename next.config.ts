import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so an unrelated lockfile further up the tree is ignored.
  turbopack: { root: __dirname },
  outputFileTracingIncludes: {
    "/*": ["./pms-core/prisma/demo.db"],
  },
  images: {
    // 95 for the home hero on retina; 88 for other heroes; 75 elsewhere.
    qualities: [75, 88, 95],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 2560, 3840],
  },
  async redirects() {
    return [{ source: "/camere/famiglia", destination: "/camere/standard", permanent: true }];
  },
};

export default nextConfig;
