/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()' },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: '/today', destination: '/', permanent: true },
      { source: '/matrix', destination: '/tasks', permanent: true },
      { source: '/google-tasks', destination: '/tasks', permanent: true },
      { source: '/projects', destination: '/tasks', permanent: true },
      { source: '/email', destination: '/inbox', permanent: true },
      { source: '/wellbeing', destination: '/health/wellbeing', permanent: true },
      { source: '/health/sources', destination: '/health/ask', permanent: true },
      { source: '/journal', destination: '/', permanent: true },
    ];
  },
};

export default nextConfig;
