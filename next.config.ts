import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.zyrosite.com',
        pathname: '/**',
      },
    ],
  },
  // Force complete cache invalidation for every build
  generateBuildId: async () => {
    // Generate unique build ID based on current timestamp and random string
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 12)
    const gitHash = process.env.VERCEL_GIT_COMMIT_SHA?.substr(0, 8) || 'local'
    return `${timestamp}-${random}-${gitHash}`
  },
  // Disable caching during build
  onDemandEntries: {
    maxInactiveAge: 0,
    pagesBufferLength: 0,
  },
  // Force TypeScript to recompile everything
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;