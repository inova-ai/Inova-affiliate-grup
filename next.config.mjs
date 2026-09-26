/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  webpack: (config, { dev }) => {
    if (!dev) {
      // Prevent production webpack cache files from retaining build-time secret values.
      config.cache = false;
    }
    return config;
  },
};
export default nextConfig;
