/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4400/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
