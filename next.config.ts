import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Force cache invalidation for Vercel deployment
  generateBuildId: async () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
};

export default nextConfig;