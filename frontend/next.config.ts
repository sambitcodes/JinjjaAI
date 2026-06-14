import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {},
  /* config options here */
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

export default nextConfig;
