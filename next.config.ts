import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    staticGenerationMaxConcurrency: 1,
    staticGenerationRetryCount: 3,
  },
};

export default nextConfig;
