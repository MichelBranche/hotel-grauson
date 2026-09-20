import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so an unrelated lockfile further up the tree is ignored.
  turbopack: { root: __dirname },
  outputFileTracingIncludes: {
    "/*": ["./pms-core/prisma/demo.db"],
  },
  images: {
    // 88 for the hero photograph, 75 everywhere else.
    qualities: [75, 88, 95],
  },
  async redirects() {
    return [{ source: "/camere/famiglia", destination: "/camere/standard", permanent: true }];
  },
};

export default nextConfig;
