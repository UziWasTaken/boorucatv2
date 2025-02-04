/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['res.cloudinary.com', 'r34cat.online'],
    unoptimized: true,
  },
  async rewrites() {
    return {
      beforeFiles: [
        // Handle post list and view
        {
          source: '/index.php',
          has: [
            {
              type: 'query',
              key: 'page',
              value: 'post'
            }
          ],
          destination: '/api/legacy-route',
        },
        // Image proxy
        {
          source: '/images/:path*',
          destination: '/api/images/:path*',
        }
      ]
    }
  }
}

module.exports = nextConfig 