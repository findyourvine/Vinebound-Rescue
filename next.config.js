/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Phaser manages its own lifecycle; avoid double-mount in dev.
  eslint: {
    // The game code is intentionally loose in places; don't block production builds on lint.
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
