const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  output: 'standalone',
  images: {
    domains: ['coachbot-n8n-01.fly.dev', 'dummyimage.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'coachbot-n8n-01.fly.dev',
      },
      {
        protocol: 'https',
        hostname: 'dummyimage.com',
      }
    ],
  },
  experimental: {
    // Hanya aktifkan fitur yang benar-benar dibutuhkan
    serverActions: {
      allowedOrigins: ['localhost:3000', 'enterprise.fly.dev'],
    },
  },
  // Disable FedCM to resolve Google Sign-In error
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'identity-credentials-get=()'
          }
        ]
      }
    ];
  }
};

module.exports = withPWA(nextConfig); 