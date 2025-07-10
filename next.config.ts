import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  experimental: {
    // Reduce bundle size by excluding unused code
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
