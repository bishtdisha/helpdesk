/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Enable SWC minification
  swcMinify: true,
  // Optimize production builds
  productionBrowserSourceMaps: false,
  // Disable React strict mode to prevent duplicate API calls in development
  reactStrictMode: false,
  // Optimize CSS
  experimental: {
    optimizeCss: true,
    // Enable optimized package imports
    optimizePackageImports: ['recharts', 'lucide-react', '@radix-ui/react-icons'],
  },
}

export default nextConfig
