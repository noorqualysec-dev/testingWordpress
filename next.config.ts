import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "qualysec.com",
      },
    ],
  },
};

export default nextConfig;
