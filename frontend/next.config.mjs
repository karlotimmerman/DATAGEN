/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 
          process.env.NODE_ENV === 'production'
            ? `${process.env.BACKEND_URL}/api/:path*` // Use environment variable
            : 'http://localhost:8000/api/:path*', // Dev environment fallback
      },
    ];
  },
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
  // Optimize the build
  swcMinify: true,
  // Set proper output directory
  output: 'standalone',
};

export default nextConfig;
