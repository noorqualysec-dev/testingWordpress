import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "qualysec.com",
      },
      {
        protocol: "https",
        hostname: "floralwhite-wombat-415522.hostingersite.com",
      },
    ],
  },
};

export default nextConfig;
