/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'tournax.gg', 'avatars.githubusercontent.com', 'cdn.discordapp.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

};

module.exports = nextConfig;
