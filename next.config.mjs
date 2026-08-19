/** @type {import('next').NextConfig} */
const nextConfig = {
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
