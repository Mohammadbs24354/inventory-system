/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // jspdf uses canvas internally; stub it out for the Node/server bundle
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    return config;
  },
};

export default nextConfig;
